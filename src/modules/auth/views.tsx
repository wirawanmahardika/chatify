import { Html } from '@elysiajs/html';
import type { User } from './model';
import { Layout, type Scripts } from '../../shared/views/layout';
import { DesktopNavigation, MobileNavigation } from '../../shared/components/navigation';

export const LoginPage = () => {
    return (
        <Layout
            title="Masuk"
            script={{ htmx: true, alpine: true }}
            class="bg-base-300 min-h-screen antialiased"
        >
            <div class="flex min-h-screen items-center justify-center p-4">
                <div class="card bg-base-100 border-base-200/50 w-full max-w-md border shadow-xl">
                    <div class="card-body gap-y-4">
                        {/* Header / Brand Logo */}
                        <div class="text-center">
                            <div class="bg-primary/10 text-primary mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            </div>
                            <h1 class="text-2xl font-bold tracking-tight">Login to Chatify</h1>
                            <p class="text-base-content/60 mt-1 text-xs">
                                Masukkan akun Anda untuk melanjutkan percakapan
                            </p>
                        </div>

                        {/* Alert Error (Jika ada error dari backend/props) */}
                        <div class="alert alert-error text-sm py-2 shadow-sm empty:hidden"></div>

                        {/* Form Login HTMX */}
                        <form
                            hx-post="/auth/login"
                            hx-target=".alert.alert-error"
                            hx-swap="innerHTML"
                            hx-on--before-request="htmx.find('.alert.alert-error').innerHTML = ''"
                            class="flex flex-col gap-y-3"
                        >
                            {/* Username Field */}
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Username</span>
                                </label>
                                <label class="input w-full input-bordered focus-within:input-primary flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="text-base-content/40 h-4 w-4"
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
                                        class="grow"
                                        placeholder="Masukkan username"
                                        required
                                    />
                                </label>
                            </div>

                            {/* Password Field */}
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Password</span>
                                </label>
                                <label class="input w-full input-bordered focus-within:input-primary flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="text-base-content/40 h-4 w-4"
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
                                        class="grow"
                                        placeholder="••••••••"
                                        required
                                    />
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button type="submit" class="btn btn-primary mt-2 w-full">
                                Login
                            </button>
                        </form>

                        {/* Divider */}
                        <div class="divider my-0 text-xs">ATAU</div>

                        {/* Navigasi ke Register */}
                        <div class="text-center text-sm">
                            <span class="text-base-content/70">Belum punya akun? </span>
                            <a
                                href="/auth/register"
                                class="link link-primary font-semibold no-underline hover:underline"
                            >
                                Daftar sekarang
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Container Toast untuk HTMX Response */}
            <div class="toast toast-top toast-center z-50"></div>
        </Layout>
    );
};

export const RegisterView = () => {
    return (
        <Layout
            title="Register"
            script={{ htmx: true }}
            class="bg-base-300 min-h-screen antialiased"
        >
            <div class="flex min-h-screen items-center justify-center p-4">
                <div class="card bg-base-100 border-base-200/50 w-full max-w-md border shadow-xl">
                    <div class="card-body gap-y-4">
                        {/* Header / Brand Logo */}
                        <div class="text-center">
                            <div class="bg-primary/10 text-primary mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                    />
                                </svg>
                            </div>
                            <h1 class="text-2xl font-bold tracking-tight">Create an Account</h1>
                            <p class="text-base-content/60 mt-1 text-xs">
                                Bergabunglah dengan Chatify sekarang
                            </p>
                        </div>

                        {/* Alert Error (Jika ada error dari backend/props) */}
                        <div class="alert alert-error text-sm py-2 shadow-sm empty:hidden"></div>

                        {/* Form Register HTMX */}
                        <form
                            hx-post="/auth/register"
                            hx-target=".alert.alert-error"
                            hx-swap="innerHTML"
                            class="flex flex-col gap-y-3"
                            hx-on--before-request="htmx.find('.alert.alert-error').innerHTML = ''"
                        >
                            {/* Username Field */}
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Username</span>
                                </label>
                                <label class="input w-full input-bordered focus-within:input-primary flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="text-base-content/40 h-4 w-4"
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
                                        class="grow"
                                        placeholder="Username (huruf, angka, _)"
                                        required
                                        minlength={3}
                                        maxlength={30}
                                        pattern="^[a-zA-Z0-9_]+$"
                                    />
                                </label>
                                <label class="label">
                                    <span class="label-text-alt text-base-content/50">
                                        Hanya alfanumerik dan garis bawah (_)
                                    </span>
                                </label>
                            </div>

                            {/* Password Field */}
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Password</span>
                                </label>
                                <label class="input w-full input-bordered focus-within:input-primary flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="text-base-content/40 h-4 w-4"
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
                                        class="grow"
                                        placeholder="Minimal 8 karakter"
                                        required
                                        minlength={8}
                                    />
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button type="submit" class="btn btn-primary mt-2 w-full">
                                Register
                            </button>
                        </form>

                        {/* Divider */}
                        <div class="divider my-0 text-xs">ATAU</div>

                        {/* Navigasi ke Login */}
                        <div class="text-center text-sm">
                            <span class="text-base-content/70">Sudah punya akun? </span>
                            <a
                                href="/auth/login"
                                class="link link-primary font-semibold no-underline hover:underline"
                            >
                                Login di sini
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export const AuthResponseError = (msg: string) => {
    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 shrink-0 stroke-current"
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
            <span>{msg}</span>
        </>
    );
};
export function ProfilePage({ user }: { user: User }) {
    const scripts: Scripts = {
        alpine: true,
        htmx: true,
        customScript: [{ src: '/public/js/chat-page.js', defer: true }],
    };

    return (
        <Layout title="Profil Saya" script={scripts}>
            <div
                x-data="{ currentPath: window.location.pathname }"
                class="bg-base-200 min-h-screen flex items-center justify-center font-sans text-base-content"
            >
                <div class="w-full h-screen bg-base-100 md:rounded-2xl md:shadow-2xl flex flex-col md:flex-row border border-base-300 overflow-hidden">
                    <DesktopNavigation />

                    {/* Main Content Container */}
                    <div class="flex-1 flex flex-col h-full bg-base-100 overflow-y-auto w-full">
                        {/* Header Panel */}
                        <div class="p-4 md:p-6 border-b border-base-300 bg-base-200/50 flex justify-between items-center">
                            <div>
                                <h1 class="text-xl font-bold">Profil Pengguna</h1>
                                <p class="text-xs text-base-content/60">
                                    Kelola detail informasi dan sesi akun Anda
                                </p>
                            </div>
                            <a
                                href="/auth/logout"
                                class="btn btn-ghost btn-circle text-error"
                                title="Logout"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke-width="1.5"
                                    stroke="currentColor"
                                    class="w-5 h-5"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                                    />
                                </svg>
                            </a>
                        </div>

                        {/* Content Area */}
                        <div class="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
                            {/* Profil Header Card */}
                            <div class="bg-base-200/40 rounded-2xl p-6 border border-base-300 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                <div class="avatar placeholder shrink-0">
                                    <div class="bg-primary text-primary-content rounded-full w-24 h-24 text-3xl font-bold flex items-center justify-center shadow-lg">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div class="space-y-1.5 flex-1 min-w-0">
                                    <div class="badge badge-primary badge-sm font-medium">
                                        Akun Terverifikasi
                                    </div>
                                    <h2 class="text-2xl md:text-3xl font-bold truncate">
                                        {user.username}
                                    </h2>
                                    <div
                                        class="inline-flex items-center gap-1.5 text-xs text-success cursor-pointer hover:underline"
                                        x-data={`{id: ${user.id}}`}
                                        x-on:click="
                                            navigator.clipboard.writeText(id);
                                            alert('ID berhasil disalin');
                                        "
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke-width="1.5"
                                            stroke="currentColor"
                                            class="w-4 h-4"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                                            />
                                        </svg>
                                        ID Pengguna:{' '}
                                        <span class="font-mono font-bold">{user.id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Informasi */}
                            <div class="bg-base-100 rounded-2xl p-6 border border-base-300 space-y-6">
                                <h3 class="text-base font-bold pb-3 border-b border-base-300">
                                    Informasi Akun
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text-alt uppercase font-bold text-base-content/60">
                                                Username
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={user.username}
                                            class="input input-bordered w-full bg-base-200/50 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>

                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text-alt uppercase font-bold text-base-content/60">
                                                Bergabung Pada
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={new Date(user.createdAt).toLocaleDateString(
                                                'id-ID',
                                                {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                }
                                            )}
                                            class="input input-bordered w-full bg-base-200/50 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                </div>

                                {/* Action Zone */}
                                <div class="pt-6 border-t border-base-300 flex justify-end">
                                    <a
                                        href="/auth/logout"
                                        class="btn btn-error btn-outline w-full md:w-auto"
                                    >
                                        Keluar Sesi (Logout)
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <MobileNavigation />
            </div>
        </Layout>
    );
}
