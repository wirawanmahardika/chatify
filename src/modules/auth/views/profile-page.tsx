import { Html } from '@elysiajs/html';
import type { User } from '../model';
import { Layout, type Scripts } from '../../../shared/views/layout';
import { UserAvatar } from '../../../shared/components/avatar';
import {
    DesktopNavigation,
    MobileNavigation,
    ThemeToggleButton,
} from '../../../shared/components/navigation';

export function ProfilePage({ user }: { user: User }) {
    const scripts: Scripts = {
        alpine: true,
        htmx: true,
        customScript: [{ src: '/public/js/chat-page.js', defer: true }],
    };

    return (
        <Layout title="Profil Saya" script={scripts}>
            <div class="bg-base-100 h-screen flex flex-col md:flex-row overflow-hidden text-base-content">
                <DesktopNavigation />

                <div class="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar pb-20 md:pb-0">
                    {/* Top Header */}
                    <header class="sticky top-0 z-10 px-5 md:px-8 py-4 border-b border-base-300/80 bg-base-100/80 backdrop-blur-md flex justify-between items-center">
                        <div>
                            <h1 class="text-lg font-bold tracking-tight">Profil & Pengaturan</h1>
                            <p class="text-xs text-base-content/60">
                                Kelola identitas akun, tampilan, dan sesi Anda
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <ThemeToggleButton class="md:hidden" />
                            <a
                                href="/auth/logout"
                                class="btn btn-ghost btn-sm rounded-xl text-error hover:bg-error/10 gap-1.5"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke-width="1.75"
                                    stroke="currentColor"
                                    class="w-4 h-4"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                                    />
                                </svg>
                                <span class="hidden sm:inline">Keluar</span>
                            </a>
                        </div>
                    </header>

                    {/* Content */}
                    <div class="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
                        <div id="avatar-alert"></div>

                        {/* Hero Card */}
                        <div class="relative overflow-hidden rounded-2xl bg-base-200/70 border border-base-300/80 p-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                            <div class="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/15 blur-3xl"></div>

                            <div class="relative shrink-0">
                                <UserAvatar
                                    username={user.username}
                                    avatarUrl={user.avatarUrl}
                                    size="xl"
                                    variant="gradient"
                                    class="shadow-xl ring-2 ring-base-100"
                                />
                                <span
                                    title="Online"
                                    class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-base-200"
                                ></span>
                            </div>

                            <div class="space-y-2.5 flex-1 min-w-0 relative">
                                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <h2 class="text-2xl font-bold truncate">{user.username}</h2>
                                    <span class="badge badge-primary badge-sm font-medium rounded-lg">
                                        Terverifikasi
                                    </span>
                                </div>

                                <div
                                    x-data={`{ id: '${user.id}', copied: false }`}
                                    class="flex items-center justify-center sm:justify-start gap-2"
                                >
                                    <button
                                        type="button"
                                        x-on:click="navigator.clipboard.writeText(id); copied = true; setTimeout(() => copied = false, 2000)"
                                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-100 border border-base-300 hover:border-primary/50 text-xs transition cursor-pointer"
                                    >
                                        <span class="text-base-content/60">ID:</span>
                                        <span class="font-mono font-semibold text-primary">
                                            {user.id}
                                        </span>
                                        <span
                                            class="text-[11px] font-medium ml-1"
                                            x-bind:class="copied ? 'text-success' : 'text-base-content/50'"
                                            x-text="copied ? 'Tersalin!' : 'Salin'"
                                        ></span>
                                    </button>
                                </div>

                                {/* Avatar Upload & Remove */}
                                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                    <form
                                        hx-post="/profile/avatar"
                                        hx-encoding="multipart/form-data"
                                        hx-target="#avatar-alert"
                                        hx-trigger="change"
                                        hx-indicator="#avatar-upload-spinner"
                                        {...{
                                            'hx-status:400': 'swap:innerHTML',
                                            'hx-status:401': 'swap:innerHTML',
                                            'hx-status:500': 'swap:innerHTML',
                                        }}
                                    >
                                        <label class="btn btn-primary btn-xs rounded-lg gap-1.5 cursor-pointer shadow-sm shadow-primary/20">
                                            <input
                                                type="file"
                                                name="avatar"
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                class="hidden"
                                            />
                                            <span
                                                id="avatar-upload-spinner"
                                                class="loading loading-spinner loading-xs htmx-indicator"
                                            ></span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke-width="1.75"
                                                stroke="currentColor"
                                                class="w-3.5 h-3.5"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                                                />
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                                                />
                                            </svg>
                                            <span>{user.avatarUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                                        </label>
                                    </form>

                                    {user.avatarUrl && (
                                        <button
                                            type="button"
                                            class="btn btn-ghost btn-xs rounded-lg text-error hover:bg-error/10"
                                            hx-delete="/profile/avatar"
                                            hx-target="#avatar-alert"
                                            hx-confirm="Hapus foto profil Anda?"
                                        >
                                            Hapus Foto
                                        </button>
                                    )}
                                    <span class="text-[11px] text-base-content/50">
                                        Maks. 2 MB (JPG, PNG, WEBP, GIF)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Account Information */}
                        <div class="rounded-2xl bg-base-200/50 border border-base-300/80 p-6 space-y-5">
                            <div class="flex items-center justify-between pb-3 border-b border-base-300/80">
                                <h3 class="text-sm font-bold uppercase tracking-wider text-base-content/70">
                                    Informasi Akun
                                </h3>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="rounded-xl bg-base-100/80 border border-base-300/70 p-4">
                                    <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
                                        Username
                                    </p>
                                    <p class="text-sm font-semibold mt-1">{user.username}</p>
                                </div>

                                <div class="rounded-xl bg-base-100/80 border border-base-300/70 p-4">
                                    <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
                                        Bergabung Pada
                                    </p>
                                    <p class="text-sm font-semibold mt-1">
                                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Appearance & Session */}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="rounded-2xl bg-base-200/50 border border-base-300/80 p-5 flex items-center justify-between gap-4">
                                <div>
                                    <h3 class="text-sm font-bold">Tema Tampilan</h3>
                                    <p class="text-xs text-base-content/60 mt-0.5">
                                        Beralih antara mode gelap dan terang
                                    </p>
                                </div>
                                <ThemeToggleButton class="border border-base-300" />
                            </div>

                            <div class="rounded-2xl bg-error/5 border border-error/20 p-5 flex items-center justify-between gap-4">
                                <div>
                                    <h3 class="text-sm font-bold text-error">Sesi Aktif</h3>
                                    <p class="text-xs text-base-content/60 mt-0.5">
                                        Akhiri sesi pada perangkat ini
                                    </p>
                                </div>
                                <a
                                    href="/auth/logout"
                                    class="btn btn-error btn-sm btn-outline rounded-xl shrink-0"
                                >
                                    Logout
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <MobileNavigation />
            </div>
        </Layout>
    );
}
