const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { Timestamp } = require('firebase/firestore');

// Execute the application modules with an in-memory Firestore substitute.
// These tests do not contact Firebase or exercise a real browser.
function loadModule(relativePath, mocks) {
    const filename = path.resolve(relativePath);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const loaded = new Module(filename, module);
    loaded.filename = filename;
    loaded.paths = Module._nodeModulePaths(path.dirname(filename));
    const originalRequire = loaded.require.bind(loaded);
    loaded.require = (name) => Object.hasOwn(mocks, name) ? mocks[name] : originalRequire(name);
    loaded._compile(source, filename);
    return loaded.exports;
}

function createFirestore() {
    const store = { documents: [], following: [], calls: [], failMain: false, failRecommendations: false, holdMain: null };
    const document = (id, authorId, seconds, nanoseconds = 0) => ({
        id,
        data: () => ({ authorId, authorName: authorId, content: id, createdAt: new Timestamp(seconds, nanoseconds) }),
    });
    const compare = (a, b) => {
        const first = a.data().createdAt;
        const second = b.data().createdAt;
        return second.seconds - first.seconds || second.nanoseconds - first.nanoseconds || (a.id < b.id ? 1 : a.id === b.id ? 0 : -1);
    };
    const api = {
        Timestamp,
        collection: (_db, ...segments) => segments.join('/'),
        documentId: () => '__name__',
        where: (field, operator, value) => ({ kind: 'where', field, operator, value }),
        orderBy: (field, direction) => ({ kind: 'order', field, direction }),
        limit: (value) => ({ kind: 'limit', value }),
        startAfter: (cursor) => ({ kind: 'cursor', cursor }),
        query: (collection, ...constraints) => ({ collection, constraints }),
        getDocs: async (query) => {
            if (typeof query === 'string') return { docs: store.following.map((id) => ({ id })) };
            const author = query.constraints.find((item) => item.kind === 'where');
            store.calls.push(query);
            if (author && store.holdMain) await store.holdMain;
            if (author ? store.failMain : store.failRecommendations) throw new Error('permission-denied (simulated)');
            let docs = store.documents.filter((doc) => !author || doc.data()[author.field] === author.value).sort(compare);
            const cursor = query.constraints.find((item) => item.kind === 'cursor');
            if (cursor) docs = docs.filter((doc) => compare(doc, cursor.cursor) > 0);
            return { docs: docs.slice(0, query.constraints.find((item) => item.kind === 'limit').value) };
        },
    };
    const feed = loadModule('src/firebase/feed.ts', { 'firebase/firestore': api, './config': { FirebaseDB: {} } });
    const tweets = loadModule('src/firebase/tweets.ts', { 'firebase/firestore': api, './config': { FirebaseDB: {} } });
    return { store, document, feed, tweets, compare };
}

// A deterministic hook scheduler lets us test async provider coordination,
// including multiple clicks before the next render, without adding dependencies.
function createProvider(feed, tweets) {
    const slots = [];
    let index = 0;
    let dirty = true;
    let value;
    let effects = [];
    const react = {
        useReducer(reducer, initial) {
            const position = index++;
            if (!slots[position]) {
                const slot = { value: initial };
                slot.dispatch = (action) => { slot.value = reducer(slot.value, action); dirty = true; };
                slots[position] = slot;
            }
            return [slots[position].value, slots[position].dispatch];
        },
        useState(initial) {
            const position = index++;
            if (!slots[position]) slots[position] = { value: initial };
            return [slots[position].value, (update) => {
                const slot = slots[position];
                slot.value = typeof update === 'function' ? update(slot.value) : update;
                dirty = true;
            }];
        },
        useRef(initial) {
            const position = index++;
            if (!slots[position]) slots[position] = { current: initial };
            return slots[position];
        },
        useEffect(callback, deps) {
            const position = index++;
            const previous = slots[position];
            if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
                effects.push(() => {
                    previous?.cleanup?.();
                    slots[position] = { deps, cleanup: callback() };
                });
            }
        },
        useCallback: (callback) => callback,
    };
    const { FeedProvider } = loadModule('src/context/FeedContext.tsx', {
        react,
        '../firebase/feed': feed,
        '../firebase/tweets': tweets,
        './useFeedContext': { FeedContext: { Provider: 'provider' } },
    });
    return {
        get value() { return value; },
        async flush() {
            for (let turn = 0; turn < 30; turn++) {
                if (dirty) {
                    dirty = false;
                    index = 0;
                    effects = [];
                    value = FeedProvider({ userId: 'me', children: null }).props.value;
                    effects.forEach((effect) => effect());
                }
                await new Promise(setImmediate);
                if (!dirty) return;
            }
            throw new Error('Provider did not settle');
        },
        unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
    };
}

for (const count of [0, 1, 2, 3, 5]) {
    test(`main feed includes own tweets and ${count} followed authors`, async () => {
        const { store, document, feed, tweets } = createFirestore();
        store.following = Array.from({ length: count }, (_, i) => `followed-${i}`);
        store.documents = [document('own', 'me', 100), document('outsider', 'other', 200),
            ...store.following.map((author, i) => document(`followed-tweet-${i}`, author, 110 + i))];
        const provider = createProvider(feed, tweets);
        await provider.flush();
        assert.deepEqual(new Set(provider.value.state.page.tweets.map((tweet) => tweet.authorId)), new Set(['me', ...store.following]));
        assert.deepEqual(provider.value.state.recommendations.map((tweet) => tweet.id), ['outsider']);
        assert.ok(provider.value.state.page.tweets.every((tweet, i, list) => i === 0 || list[i - 1].createdAt.seconds >= tweet.createdAt.seconds));
        provider.unmount();
    });
}

test('cursor pages have at most ten tweets, deterministic ties and no duplicates', async () => {
    const { store, document, feed, compare } = createFirestore();
    store.documents = Array.from({ length: 37 }, (_, i) => document(`tweet-${String(i).padStart(2, '0')}`, i % 2 ? 'me' : 'followed', 100 - Math.floor(i / 5), i % 3));
    const seen = [];
    let cursor = null;
    let page;
    do {
        page = await feed.getFeedPage(['me', 'followed', 'me'], cursor);
        assert.ok(page.tweets.length <= 10);
        seen.push(...page.tweets.map((tweet) => tweet.id));
        cursor = page.nextCursor;
    } while (page.hasMore);
    assert.equal(seen.length, 37);
    assert.equal(new Set(seen).size, 37);
    assert.deepEqual(seen, [...store.documents].sort(compare).map((doc) => doc.id));
    assert.ok(store.calls.every((query) => query.constraints.some((item) => item.kind === 'order' && item.field === '__name__' && item.direction === 'desc')));
});

test('rapid pagination clicks issue one navigation; recommendations do not reload on page changes', async () => {
    const { store, document, feed, tweets } = createFirestore();
    store.documents = Array.from({ length: 24 }, (_, i) => document(`own-${i}`, 'me', 100 - i));
    const provider = createProvider(feed, tweets);
    await provider.flush();
    const initial = provider.value.state.page.tweets.map((tweet) => tweet.id);
    let release;
    store.holdMain = new Promise((resolve) => { release = resolve; });
    provider.value.handleNextPage();
    provider.value.handleNextPage();
    await provider.flush();
    provider.value.handleNextPage();
    assert.equal(provider.value.state.pageIndex, 1);
    assert.equal(store.calls.filter((query) => query.constraints.some((item) => item.kind === 'where')).length, 2);
    assert.equal(store.calls.filter((query) => !query.constraints.some((item) => item.kind === 'where')).length, 1);
    release();
    store.holdMain = null;
    await provider.flush();
    assert.ok(provider.value.state.page.tweets.every((tweet) => !initial.includes(tweet.id)));
    provider.value.handlePreviousPage();
    await provider.flush();
    assert.deepEqual(provider.value.state.page.tweets.map((tweet) => tweet.id), initial);
    provider.unmount();
});

test('following and unfollowing reset pagination and update main authors', async () => {
    const { store, document, feed, tweets } = createFirestore();
    store.documents = [...Array.from({ length: 11 }, (_, i) => document(`own-${i}`, 'me', 100 - i)), document('new-author', 'other', 200)];
    const provider = createProvider(feed, tweets);
    await provider.flush();
    provider.value.handleNextPage();
    await provider.flush();
    store.following = ['other'];
    provider.value.handleFollowingChanged();
    await provider.flush();
    assert.equal(provider.value.state.pageIndex, 0);
    assert.equal(provider.value.state.page.tweets[0].id, 'new-author');
    assert.ok(!provider.value.state.recommendations.some((tweet) => tweet.authorId === 'other'));
    store.following = [];
    provider.value.handleFollowingChanged();
    await provider.flush();
    assert.ok(provider.value.state.page.tweets.every((tweet) => tweet.authorId === 'me'));
    assert.equal(provider.value.state.recommendations[0].id, 'new-author');
    provider.unmount();
});

test('a newly saved own tweet is loaded first on return to the feed', async () => {
    const { store, document, feed, tweets } = createFirestore();
    store.documents.push(document('newly-published', 'me', 200));
    const provider = createProvider(feed, tweets);
    await provider.flush();
    assert.equal(provider.value.state.page.tweets[0].id, 'newly-published');
    provider.unmount();
});

test('empty feed, main errors and recommendation errors have independent states and retries', async () => {
    const { store, document, feed, tweets } = createFirestore();
    const provider = createProvider(feed, tweets);
    await provider.flush();
    assert.deepEqual(provider.value.state.page.tweets, []);
    assert.equal(provider.value.state.page.hasMore, false);
    store.documents.push(document('own', 'me', 100));
    store.failRecommendations = true;
    provider.value.handleRetry();
    provider.value.handleRecommendationsRetry();
    await provider.flush();
    assert.equal(provider.value.state.page.tweets[0].id, 'own');
    assert.equal(provider.value.state.errorMessage, null);
    assert.ok(provider.value.state.recommendationsError);
    const mainCalls = store.calls.filter((query) => query.constraints.some((item) => item.kind === 'where')).length;
    store.failRecommendations = false;
    provider.value.handleRecommendationsRetry();
    await provider.flush();
    assert.equal(provider.value.state.recommendationsError, null);
    assert.equal(store.calls.filter((query) => query.constraints.some((item) => item.kind === 'where')).length, mainCalls);
    store.failMain = true;
    provider.value.handleRetry();
    await provider.flush();
    assert.ok(provider.value.state.errorMessage);
    assert.equal(provider.value.state.isLoading, false);
    store.failMain = false;
    provider.value.handleRetry();
    await provider.flush();
    assert.equal(provider.value.state.errorMessage, null);
    provider.unmount();
});
