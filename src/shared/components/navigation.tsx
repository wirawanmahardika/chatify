import { Html } from '@elysiajs/html';

export function ThemeToggleButton({ class: className = '' }: { class?: string }) {
    return (
        <button
            type="button"
            x-data="{ isDark: document.documentElement.getAttribute('data-theme') !== 'chatify-light' }"
            {...{ 'x-on:chatify:theme-changed.window': "isDark = $event.detail.theme === 'chatify-dark'" }}
            x-on:click="window.toggleChatifyTheme()"
            x-bind:title="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
            aria-label="Ganti tema tampilan"
            class={`btn btn-ghost btn-square btn-sm rounded-xl text-base-content/70 hover:text-base-content hover:bg-base-300/60 transition ${className}`}
        >
            {/* Sun Icon (shown in dark mode to switch to light) */}
            <svg
                x-show="isDark"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.75"
                stroke="currentColor"
                class="size-5"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                />
            </svg>
            {/* Moon Icon (shown in light mode to switch to dark) */}
            <svg
                x-show="!isDark"
                x-cloak
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.75"
                stroke="currentColor"
                class="size-5"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                />
            </svg>
        </button>
    );
}

export function DesktopNavigation() {
    return (
        <nav
            x-data={'{ currentPath: window.location.pathname }'}
            class="hidden md:flex flex-col items-center py-4 px-2.5 w-17 bg-base-200/80 border-r border-base-300/80 gap-4 shrink-0 select-none"
        >
            {/* Brand Mark */}
            <a
                href="/"
                title="Chatify"
                class="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent text-primary-content flex items-center justify-center shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="size-5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                </svg>
            </a>

            <div class="w-6 h-px bg-base-300/80"></div>

            {/* Primary Nav */}
            <div class="flex-1 flex flex-col items-center gap-2 w-full">
                <a
                    href="/"
                    title="Obrolan"
                    class="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                    x-bind:class={
                        "currentPath === '/' ? 'bg-primary text-primary-content shadow-md shadow-primary/25' : 'text-base-content/60 hover:bg-base-300/70 hover:text-base-content'"
                    }
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.75"
                        stroke="currentColor"
                        class="size-5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                        />
                    </svg>
                </a>

                <a
                    href="/contact"
                    title="Kontak & Pertemanan"
                    class="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                    x-bind:class={
                        "currentPath.startsWith('/contact') ? 'bg-primary text-primary-content shadow-md shadow-primary/25' : 'text-base-content/60 hover:bg-base-300/70 hover:text-base-content'"
                    }
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.75"
                        stroke="currentColor"
                        class="size-5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                        />
                    </svg>
                </a>
            </div>

            {/* Bottom Utility Stack */}
            <div class="flex flex-col items-center gap-2 mt-auto">
                <ThemeToggleButton class="w-10 h-10" />

                <a
                    href="/profile"
                    title="Profil & Pengaturan"
                    class="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                    x-bind:class={
                        "currentPath.startsWith('/profile') ? 'bg-primary text-primary-content shadow-md shadow-primary/25' : 'text-base-content/60 hover:bg-base-300/70 hover:text-base-content'"
                    }
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.75"
                        stroke="currentColor"
                        class="size-5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                    </svg>
                </a>

                <a
                    href="/auth/logout"
                    title="Keluar (Logout)"
                    class="w-10 h-10 flex items-center justify-center rounded-xl text-error/80 hover:text-error hover:bg-error/10 transition-all"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.75"
                        stroke="currentColor"
                        class="size-5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                        />
                    </svg>
                </a>
            </div>
        </nav>
    );
}

export function MobileNavigation({ hideWhen = '' }: { hideWhen?: string }) {
    return (
        <div
            x-data={'{ currentPath: window.location.pathname }'}
            {...(hideWhen ? { 'x-show': hideWhen } : {})}
            class="dock md:hidden bg-base-200/95 backdrop-blur-lg border-t border-base-300/80 z-30"
        >
            <button
                type="button"
                x-on:click="window.location.href = '/'"
                x-bind:class={"currentPath === '/' ? 'dock-active text-primary' : 'text-base-content/60'"}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.75"
                    stroke="currentColor"
                    class="size-5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                    />
                </svg>
                <span class="dock-label">Obrolan</span>
            </button>

            <button
                type="button"
                x-on:click="window.location.href = '/contact'"
                x-bind:class={"currentPath.startsWith('/contact') ? 'dock-active text-primary' : 'text-base-content/60'"}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.75"
                    stroke="currentColor"
                    class="size-5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                </svg>
                <span class="dock-label">Kontak</span>
            </button>

            <button
                type="button"
                x-on:click="window.location.href = '/profile'"
                x-bind:class={"currentPath.startsWith('/profile') ? 'dock-active text-primary' : 'text-base-content/60'"}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.75"
                    stroke="currentColor"
                    class="size-5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                </svg>
                <span class="dock-label">Profil</span>
            </button>
        </div>
    );
}
