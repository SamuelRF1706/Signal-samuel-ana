import { Avatar } from './Avatar';

export const UserIdentity = ({ name, username, detail }: { name: string; username?: string; detail?: string }) => (
    <span className="user-identity">
        <Avatar name={name} />
        <span className="user-identity-copy">
            <span className="user-name">{name}</span>
            {username && <span className="user-handle">@{username}</span>}
            {detail && <span className="user-detail">{detail}</span>}
        </span>
    </span>
);
