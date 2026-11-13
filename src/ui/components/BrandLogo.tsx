import type { CSSProperties } from 'react';
import fullLogo from '../../assets/brand/logo-completo.png';
import horizontalLogo from '../../assets/brand/logo-horizontal.png';
import symbolLogo from '../../assets/brand/simbolo-signal.svg';

const variants = {
    full: { src: fullLogo, width: 1500, height: 560, displayWidth: 320, alt: 'Signal — Tu voz conecta' },
    horizontal: { src: horizontalLogo, width: 1500, height: 533, displayWidth: 180, alt: 'Signal' },
    symbol: { src: symbolLogo, width: 256, height: 256, displayWidth: 40, alt: 'Signal' },
};

interface BrandLogoProps {
    variant?: keyof typeof variants;
    width?: CSSProperties['width'];
    height?: CSSProperties['height'];
    className?: string;
    alt?: string;
    decorative?: boolean;
}

export const BrandLogo = ({
    variant = 'horizontal',
    width,
    height,
    className,
    alt,
    decorative = false,
}: BrandLogoProps) => {
    const logo = variants[variant];
    return (
        <img
            src={logo.src}
            width={logo.width}
            height={logo.height}
            alt={decorative ? '' : alt ?? logo.alt}
            aria-hidden={decorative || undefined}
            className={className}
            style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                width: width ?? (height === undefined ? logo.displayWidth : 'auto'),
                height: height ?? 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
            }}
        />
    );
};
