import { Html } from '@elysiajs/html';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'primary' | 'accent' | 'error' | 'neutral' | 'gradient';

const SIZE_CLASSES: Record<AvatarSize, string> = {
    xs: 'w-8 h-8 rounded-lg text-xs',
    sm: 'w-9 h-9 rounded-xl text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-16 h-16 rounded-2xl text-2xl',
    xl: 'w-20 h-20 rounded-2xl text-3xl',
};

const VARIANT_CLASSES: Record<AvatarVariant, string> = {
    primary: 'bg-primary/15 text-primary',
    accent: 'bg-accent/15 text-accent',
    error: 'bg-error/15 text-error',
    neutral: 'bg-base-300 text-base-content',
    gradient: 'bg-gradient-to-br from-primary to-accent text-primary-content shadow-md shadow-primary/20',
};

export function UserAvatar({
    username,
    avatarUrl,
    size = 'md',
    variant = 'primary',
    class: className = '',
}: {
    username: string;
    avatarUrl?: string | null;
    size?: AvatarSize;
    variant?: AvatarVariant;
    class?: string;
}) {
    const initial = (username || '?').charAt(0).toUpperCase();
    const sizeCls = SIZE_CLASSES[size];
    const variantCls = avatarUrl ? 'bg-base-300' : VARIANT_CLASSES[variant];

    return (
        <div
            class={`overflow-hidden flex items-center justify-center font-bold shrink-0 ${sizeCls} ${variantCls} ${className}`}
        >
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={username}
                    class="w-full h-full object-cover"
                    loading="lazy"
                />
            ) : (
                initial
            )}
        </div>
    );
}
