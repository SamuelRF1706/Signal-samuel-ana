const paths = {
    home: <><path d="m3 10 9-7 9 7v10H15v-6H9v6H3Z" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5" /></>,
    following: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-10 2 2 4-4" /></>,
    profile: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="9" r="3" /><path d="M5 18a8 8 0 0 1 14 0" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    logout: <><path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    write: <><path d="m16 3 5 5-11 11-7 2 2-7ZM14 5l5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
};

export const Icon = ({ name, className = '' }: { name: keyof typeof paths; className?: string }) => (
    <svg className={`signal-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {paths[name]}
    </svg>
);
