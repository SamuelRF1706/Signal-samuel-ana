interface AvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Avatar = ({ name, size = 'md' }: AvatarProps) => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    const initials = words.slice(0, 2).map((word) => Array.from(word)[0]).join('').toLocaleUpperCase('es') || 'S';
    const tone = Array.from(name).reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0) % 3;
    return <span className={`signal-avatar avatar-${size} avatar-tone-${tone}`} aria-hidden="true">{initials}</span>;
};
