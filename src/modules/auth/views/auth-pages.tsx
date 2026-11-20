import { Html } from '@elysiajs/html';
import { Layout } from '../../../shared/views/layout';
import { ThemeToggleButton } from '../../../shared/components/navigation';

function AuthShell({
    title,
    children,
}: {
    title: string;
    children: any;
}) {
    return (
        <Layout
            title={title}
            script={{ htmx: true, alpine: true }}
            class="bg-base-100 text-base-content min-h-screen antialiased relative overflow-x-hidden"
        >
            {/* Ambient background */}
            <div class="pointer-events-none fixed inset-0 bg-ambient-grid opacity-50"></div>
            <div class="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-155 h-105 rounded-full bg-primary/15 blur-[120px]"></div>
            <div class="pointer-events-none fixed bottom-0 right-0 w-95 h-95 rounded-full bg-accent/10 blur-[120px]"></div>

            {/* Top bar */}
            <header class="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
                <a href="/" class="flex items-center gap-2.5 group">
                    <div class="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-accent text-primary-content flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
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
                    </div>
                    <span class="font-bold text-lg tracking-tight">Chatify</span>
                </a>
                <ThemeToggleButton />
            </header>

            <main class="relative z-10 flex min-h-[calc(100vh-76px)] items-center justify-center px-4 pb-12">
                {children}
            </main>
        </Layout>
    );
}

export const LoginPage = () => {
    return (
        <AuthShell title="Masuk">
            <div class="w-full max-w-md rounded-2xl bg-base-200/80 backdrop-blur-xl border border-base-300/90 shadow-2xl p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div class="space-y-1.5 text-center">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        Selamat Datang Kembali
                    </span>
                    <h1 class="text-2xl font-bold tracking-tight pt-1">Masuk ke Chatify</h1>
                    <p class="text-base-content/60 text-xs">
                        Lanjutkan percakapan real-time Anda dengan cepat dan aman
                    </p>
                </div>

                {/* Alert Error */}
                <div class="alert alert-error text-xs py-2.5 px-3.5 rounded-xl bg-error/15 border border-error/30 text-error empty:hidden"></div>

                {/* Form Login HTMX */}
                <form
                    hx-post="/auth/login"
                    hx-target=".alert.alert-error"
                    hx-swap="innerHTML"
                    {...{
                        'hx-on:htmx:before:request':
                            "htmx.find('.alert.alert-error').innerHTML = ''",
                    }}
                    class="flex flex-col gap-y-4"
                >
                    <div class="form-control gap-1.5">
                        <label class="text-xs font-semibold text-base-content/80">Username</label>
                        <label class="input w-full bg-base-100/80 border-base-300 focus-within:border-primary focus-within:outline-none flex items-center gap-2.5 rounded-xl">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="text-base-content/40 h-4 w-4 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            <input
                                name="username"
                                type="text"
                                class="grow text-sm"
                                placeholder="Masukkan username"
                                required
                            />
                        </label>
                    </div>

                    <div class="form-control gap-1.5">
                        <label class="text-xs font-semibold text-base-content/80">Password</label>
                        <label class="input w-full bg-base-100/80 border-base-300 focus-within:border-primary focus-within:outline-none flex items-center gap-2.5 rounded-xl">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="text-base-content/40 h-4 w-4 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                            <input
                                name="password"
                                type="password"
                                class="grow text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary w-full rounded-xl mt-1 shadow-lg shadow-primary/20 font-semibold"
                    >
                        Masuk
                    </button>
                </form>

                <div class="divider my-0 text-[11px] text-base-content/40">ATAU</div>

                <div class="text-center text-xs">
                    <span class="text-base-content/60">Belum punya akun? </span>
                    <a
                        href="/auth/register"
                        class="text-primary font-semibold hover:underline"
                    >
                        Daftar sekarang
                    </a>
                </div>
            </div>
        </AuthShell>
    );
};

export const RegisterView = () => {
    return (
        <AuthShell title="Daftar">
            <div class="w-full max-w-md rounded-2xl bg-base-200/80 backdrop-blur-xl border border-base-300/90 shadow-2xl p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div class="space-y-1.5 text-center">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                        Akun Baru
                    </span>
                    <h1 class="text-2xl font-bold tracking-tight pt-1">Buat Akun Chatify</h1>
                    <p class="text-base-content/60 text-xs">
                        Bergabung sekarang dan mulai terhubung dengan teman atau tim Anda
                    </p>
                </div>

                {/* Alert Error */}
                <div class="alert alert-error text-xs py-2.5 px-3.5 rounded-xl bg-error/15 border border-error/30 text-error empty:hidden"></div>

                {/* Form Register HTMX */}
                <form
                    hx-post="/auth/register"
                    hx-target=".alert.alert-error"
                    hx-swap="innerHTML"
                    class="flex flex-col gap-y-4"
                    {...{
                        'hx-on:htmx:before:request':
                            "htmx.find('.alert.alert-error').innerHTML = ''",
                    }}
                >
                    <div class="form-control gap-1.5">
                        <label class="text-xs font-semibold text-base-content/80">Username</label>
                        <label class="input w-full bg-base-100/80 border-base-300 focus-within:border-primary focus-within:outline-none flex items-center gap-2.5 rounded-xl">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="text-base-content/40 h-4 w-4 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            <input
                                name="username"
                                type="text"
                                class="grow text-sm"
                                placeholder="Username (huruf, angka, _)"
                                required
                                minlength={3}
                                maxlength={30}
                                pattern="^[a-zA-Z0-9_]+$"
                            />
                        </label>
                        <span class="text-[11px] text-base-content/50">
                            Minimal 3 karakter. Hanya huruf, angka, dan garis bawah (_).
                        </span>
                    </div>

                    <div class="form-control gap-1.5">
                        <label class="text-xs font-semibold text-base-content/80">Password</label>
                        <label class="input w-full bg-base-100/80 border-base-300 focus-within:border-primary focus-within:outline-none flex items-center gap-2.5 rounded-xl">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="text-base-content/40 h-4 w-4 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                            <input
                                name="password"
                                type="password"
                                class="grow text-sm"
                                placeholder="Minimal 8 karakter"
                                required
                                minlength={8}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary w-full rounded-xl mt-1 shadow-lg shadow-primary/20 font-semibold"
                    >
                        Daftar Sekarang
                    </button>
                </form>

                <div class="divider my-0 text-[11px] text-base-content/40">ATAU</div>

                <div class="text-center text-xs">
                    <span class="text-base-content/60">Sudah punya akun? </span>
                    <a
                        href="/auth/login"
                        class="text-primary font-semibold hover:underline"
                    >
                        Masuk di sini
                    </a>
                </div>
            </div>
        </AuthShell>
    );
};

export const AuthResponseError = (msg: string) => {
    return (
        <div class="flex items-center gap-2.5">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <span class="font-medium">{msg}</span>
        </div>
    );
};
