import { Html } from '@elysiajs/html';
import type { RequestFriendship, UserSearchResult } from '../model';
import { Layout, type Scripts } from '../../../shared/views/layout';
import type { User } from '../../auth/model';
import { UserAvatar } from '../../../shared/components/avatar';
import {
    DesktopNavigation,
    MobileNavigation,
    ThemeToggleButton,
} from '../../../shared/components/navigation';

export const ContactsPage = ({
    contacts,
    user,
    incomingRequests = [],
    outgoingRequests = [],
    blockedUsers = [],
}: {
    user: User;
    contacts: RequestFriendship[];
    incomingRequests?: RequestFriendship[];
    outgoingRequests?: RequestFriendship[];
    blockedUsers?: RequestFriendship[];
}) => {
    const scripts: Scripts = {
        alpine: true,
        htmx: true,
        customScript: [{ src: '/public/js/chat-page.js', defer: true }],
    };
    const totalRequests = incomingRequests.length + outgoingRequests.length;

    return (
        <Layout title="Kelola Kontak" script={scripts}>
            <div
                x-data="{ search: '', activeTab: 'contacts' }"
                class="bg-base-100 h-screen flex flex-col md:flex-row overflow-hidden text-base-content"
            >
                <DesktopNavigation />

                {/* Left Sidebar - Contacts & Requests */}
                <aside class="w-full md:w-80 lg:w-90 border-r border-base-300/80 flex flex-col bg-base-200/40 shrink-0 h-full pb-16 md:pb-0">
                    {/* User Header */}
                    <div class="px-4 py-3.5 border-b border-base-300/80 flex justify-between items-center bg-base-200/60">
                        <div class="flex items-center gap-3 min-w-0">
                            <UserAvatar
                                username={user.username}
                                avatarUrl={user.avatarUrl}
                                size="md"
                                variant="gradient"
                            />
                            <div class="min-w-0">
                                <h2 class="font-bold text-sm truncate leading-tight">
                                    {user.username}
                                </h2>
                                <button
                                    type="button"
                                    x-data={`{ id: '${user.id}', copied: false }`}
                                    x-on:click="navigator.clipboard.writeText(id); copied = true; setTimeout(() => copied = false, 1800)"
                                    class="text-[11px] font-mono text-base-content/60 hover:text-primary mt-0.5 cursor-pointer transition"
                                >
                                    <span x-text="copied ? 'ID Tersalin!' : '#' + id"></span>
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center gap-1">
                            <ThemeToggleButton class="md:hidden" />
                            <button
                                type="button"
                                onclick="add_contact_modal.showModal()"
                                class="btn btn-primary btn-xs rounded-lg gap-1 shadow-sm shadow-primary/20"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke-width="2"
                                    stroke="currentColor"
                                    class="w-3.5 h-3.5"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                                Tambah
                            </button>
                        </div>
                    </div>

                    {/* Segmented Tabs */}
                    <div class="px-3 pt-3 pb-2">
                        <div class="grid grid-cols-3 gap-1 p-1 rounded-xl bg-base-300/60">
                            <button
                                type="button"
                                x-on:click="activeTab = 'contacts'"
                                x-bind:class="activeTab === 'contacts' ? 'bg-base-100 text-base-content shadow-sm' : 'text-base-content/60 hover:text-base-content'"
                                class="py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                                Kontak ({contacts.length})
                            </button>
                            <button
                                type="button"
                                x-on:click="activeTab = 'requests'"
                                x-bind:class="activeTab === 'requests' ? 'bg-base-100 text-base-content shadow-sm' : 'text-base-content/60 hover:text-base-content'"
                                class="py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                            >
                                <span>Minta</span>
                                {totalRequests > 0 && (
                                    <span class="px-1.5 rounded-full bg-error text-error-content text-[10px] font-bold">
                                        {totalRequests}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                x-on:click="activeTab = 'blocked'"
                                x-bind:class="activeTab === 'blocked' ? 'bg-base-100 text-base-content shadow-sm' : 'text-base-content/60 hover:text-base-content'"
                                class="py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                                Blokir ({blockedUsers.length})
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div class="px-3 pb-2.5 border-b border-base-300/80">
                        <label class="input input-sm w-full bg-base-100/80 border-base-300/80 focus-within:border-primary focus-within:outline-none flex items-center gap-2 rounded-xl">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                class="w-3.5 h-3.5 text-base-content/40 shrink-0"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                            <input
                                type="text"
                                x-model="search"
                                class="grow text-xs"
                                placeholder="Filter nama atau ID..."
                            />
                        </label>
                    </div>

                    {/* TAB 1: Contacts */}
                    <div
                        id="contacts"
                        hx-get="/contacts"
                        hx-trigger="updateContacts from:body"
                        x-show="activeTab === 'contacts'"
                        class="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar"
                    >
                        {contacts.length === 0 ? (
                            <div class="text-center px-6 py-10 text-base-content/50 text-xs">
                                Belum ada kontak tersimpan.
                            </div>
                        ) : (
                            contacts.map((contact) => (
                                <div
                                    x-show={`!search || '${contact.username}'.toLowerCase().includes(search.toLowerCase()) || '${contact.oppositeId}'.includes(search)`}
                                    class="flex items-center justify-between p-2.5 rounded-xl bg-base-100/50 hover:bg-base-100 border border-transparent hover:border-base-300/80 transition w-full"
                                >
                                    <div class="flex items-center gap-3 min-w-0">
                                        <UserAvatar
                                            username={contact.username}
                                            avatarUrl={contact.avatarUrl}
                                            size="sm"
                                            variant="primary"
                                        />
                                        <div class="min-w-0">
                                            <h3 class="font-semibold text-sm truncate">
                                                {contact.username}
                                            </h3>
                                            <span class="text-[11px] font-mono text-base-content/50 block truncate">
                                                ID: {contact.oppositeId}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1 shrink-0">
                                        <form method="POST" action="/direct">
                                            <input
                                                type="hidden"
                                                name="targetUserId"
                                                value={contact.oppositeId}
                                            />
                                            <button
                                                type="submit"
                                                class="btn btn-ghost btn-square btn-xs rounded-lg text-primary hover:bg-primary/10"
                                                title="Mulai Chat"
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
                                                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.85l1.052-3.76-A8.967 8.967 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                                                    />
                                                </svg>
                                            </button>
                                        </form>
                                        <button
                                            type="button"
                                            class="btn btn-ghost btn-square btn-xs rounded-lg text-error/80 hover:text-error hover:bg-error/10"
                                            title="Blokir Pengguna"
                                            hx-confirm={`Blokir ${contact.username}? Anda tidak akan bisa saling mengirim pesan.`}
                                            hx-post="/contact/block"
                                            hx-vals={`{"id": "${contact.oppositeId}"}`}
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
                                                    d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* TAB 2: Friend Requests */}
                    <div
                        id="friend-requests"
                        x-show="activeTab === 'requests'"
                        x-cloak
                        class="flex-1 overflow-y-auto p-2.5 space-y-4 custom-scrollbar"
                    >
                        {totalRequests === 0 ? (
                            <div class="text-center px-6 py-10 text-base-content/50 text-xs">
                                Tidak ada permintaan pertemanan.
                            </div>
                        ) : (
                            <>
                                {incomingRequests.length > 0 && (
                                    <div class="space-y-1.5">
                                        <p class="px-2 text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                                            Permintaan Masuk ({incomingRequests.length})
                                        </p>
                                        {incomingRequests.map((req) => (
                                            <div
                                                x-show={`!search || '${req.username}'.toLowerCase().includes(search.toLowerCase()) || '${req.oppositeId}'.includes(search)`}
                                                class="flex items-center justify-between p-2.5 rounded-xl bg-base-100/60 border border-base-300/70 gap-2"
                                            >
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <UserAvatar
                                                        username={req.username}
                                                        avatarUrl={req.avatarUrl}
                                                        size="sm"
                                                        variant="accent"
                                                    />
                                                    <div class="min-w-0">
                                                        <h3 class="font-semibold text-sm truncate">
                                                            {req.username}
                                                        </h3>
                                                        <span class="text-[11px] font-mono text-base-content/50 block truncate">
                                                            ID: {req.oppositeId}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        class="btn btn-success btn-xs rounded-lg text-white"
                                                        hx-confirm={`Terima permintaan pertemanan dari ${req.username}?`}
                                                        hx-patch="/contact"
                                                        hx-vals={`{"id": "${req.oppositeId}", "status": "accepted"}`}
                                                    >
                                                        Terima
                                                    </button>
                                                    <button
                                                        type="button"
                                                        class="btn btn-ghost btn-xs rounded-lg text-error"
                                                        hx-confirm={`Tolak permintaan pertemanan dari ${req.username}?`}
                                                        hx-patch="/contact"
                                                        hx-vals={`{"id": "${req.oppositeId}", "status": "rejected"}`}
                                                    >
                                                        Tolak
                                                    </button>
                                                    <button
                                                        type="button"
                                                        class="btn btn-ghost btn-xs rounded-lg text-warning"
                                                        hx-confirm={`Blokir ${req.username}?`}
                                                        hx-post="/contact/block"
                                                        hx-vals={`{"id": "${req.oppositeId}"}`}
                                                    >
                                                        Blokir
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {outgoingRequests.length > 0 && (
                                    <div class="space-y-1.5">
                                        <p class="px-2 text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                                            Permintaan Terkirim ({outgoingRequests.length})
                                        </p>
                                        {outgoingRequests.map((req) => (
                                            <div
                                                x-show={`!search || '${req.username}'.toLowerCase().includes(search.toLowerCase()) || '${req.oppositeId}'.includes(search)`}
                                                class="flex items-center justify-between p-2.5 rounded-xl bg-base-100/60 border border-base-300/70 gap-2"
                                            >
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <UserAvatar
                                                        username={req.username}
                                                        avatarUrl={req.avatarUrl}
                                                        size="sm"
                                                        variant="neutral"
                                                    />
                                                    <div class="min-w-0">
                                                        <h3 class="font-semibold text-sm truncate">
                                                            {req.username}
                                                        </h3>
                                                        <span class="text-[11px] text-base-content/50 block truncate">
                                                            Menunggu konfirmasi
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    class="btn btn-ghost btn-xs rounded-lg text-error shrink-0"
                                                    hx-confirm={`Batalkan permintaan pertemanan ke ${req.username}?`}
                                                    hx-delete={`/contact/${req.oppositeId}`}
                                                >
                                                    Batalkan
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* TAB 3: Blocked Users */}
                    <div
                        id="blocked-users"
                        x-show="activeTab === 'blocked'"
                        x-cloak
                        class="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar"
                    >
                        {blockedUsers.length === 0 ? (
                            <div class="text-center px-6 py-10 text-base-content/50 text-xs">
                                Tidak ada pengguna yang diblokir.
                            </div>
                        ) : (
                            blockedUsers.map((blocked) => (
                                <div
                                    x-show={`!search || '${blocked.username}'.toLowerCase().includes(search.toLowerCase()) || '${blocked.oppositeId}'.includes(search)`}
                                    class="flex items-center justify-between p-2.5 rounded-xl bg-base-100/60 border border-base-300/70 gap-2"
                                >
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <UserAvatar
                                            username={blocked.username}
                                            avatarUrl={blocked.avatarUrl}
                                            size="sm"
                                            variant="error"
                                        />
                                        <div class="min-w-0">
                                            <h3 class="font-semibold text-sm truncate">
                                                {blocked.username}
                                            </h3>
                                            <span class="text-[11px] font-mono text-base-content/50 block truncate">
                                                ID: {blocked.oppositeId}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        class="btn btn-outline btn-xs rounded-lg shrink-0"
                                        hx-confirm={`Buka blokir ${blocked.username}?`}
                                        hx-delete={`/contact/block/${blocked.oppositeId}`}
                                    >
                                        Buka Blokir
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Right Main Panel - Contacts Overview */}
                <main class="flex-1 hidden md:flex flex-col h-full bg-base-100 overflow-y-auto relative custom-scrollbar">
                    <div class="pointer-events-none absolute inset-0 bg-ambient-grid opacity-25"></div>
                    <div class="relative z-10 max-w-3xl mx-auto w-full p-8 space-y-6 my-auto">
                        <div class="space-y-2">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                Jaringan Pertemanan
                            </span>
                            <h1 class="text-2xl font-bold tracking-tight">
                                Manajemen Kontak & Undangan
                            </h1>
                            <p class="text-xs text-base-content/60 max-w-lg leading-relaxed">
                                Kelola daftar teman, terima permintaan masuk, atur daftar blokir,
                                atau bagikan tautan undangan pribadi Anda.
                            </p>
                        </div>

                        {/* Stats */}
                        <div class="grid grid-cols-3 gap-4">
                            <div class="rounded-2xl bg-base-200/70 border border-base-300/80 p-4">
                                <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
                                    Total Teman
                                </p>
                                <p class="text-2xl font-bold mt-1">{contacts.length}</p>
                            </div>
                            <div class="rounded-2xl bg-base-200/70 border border-base-300/80 p-4">
                                <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
                                    Permintaan
                                </p>
                                <p class="text-2xl font-bold mt-1 text-primary">{totalRequests}</p>
                            </div>
                            <div class="rounded-2xl bg-base-200/70 border border-base-300/80 p-4">
                                <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
                                    Diblokir
                                </p>
                                <p class="text-2xl font-bold mt-1 text-error">
                                    {blockedUsers.length}
                                </p>
                            </div>
                        </div>

                        {/* Quick Invite Link Card */}
                        <div
                            class="rounded-2xl bg-base-200/70 border border-base-300/80 p-5 flex items-center justify-between gap-4"
                            x-data={`{ invitePath: '/contact/invite/${user.id}', copied: false }`}
                        >
                            <div class="min-w-0">
                                <h3 class="text-sm font-bold">Link Undangan Anda</h3>
                                <p
                                    class="text-xs font-mono text-base-content/60 truncate mt-1"
                                    x-text="window.location.origin + invitePath"
                                ></p>
                            </div>
                            <button
                                type="button"
                                class="btn btn-outline btn-sm rounded-xl shrink-0"
                                x-on:click="
                                    navigator.clipboard.writeText(window.location.origin + invitePath);
                                    copied = true;
                                    setTimeout(() => copied = false, 2000);
                                "
                                x-text="copied ? 'Tersalin!' : 'Salin Link'"
                            ></button>
                        </div>

                        <div>
                            <button
                                type="button"
                                onclick="add_contact_modal.showModal()"
                                class="btn btn-primary rounded-xl shadow-lg shadow-primary/20"
                            >
                                Cari & Tambah Teman Baru
                            </button>
                        </div>
                    </div>
                </main>

                <MobileNavigation />
            </div>

            {/* Modal - Search User & Invite Link */}
            <dialog id="add_contact_modal" class="modal">
                <div class="modal-box bg-base-200 border border-base-300 rounded-2xl shadow-2xl space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-base">Tambah Teman</h3>
                        <button
                            type="button"
                            onclick="add_contact_modal.close()"
                            class="btn btn-ghost btn-xs btn-square rounded-lg"
                        >
                            ✕
                        </button>
                    </div>

                    <div id="modal-alert-message"></div>

                    <div class="form-control gap-1.5">
                        <label class="text-xs font-semibold text-base-content/80">
                            Cari Username atau ID 6 Digit
                        </label>
                        <input
                            type="text"
                            name="q"
                            placeholder="Ketik minimal 3 huruf username atau ID 6 digit..."
                            class="input input-bordered bg-base-100 w-full input-sm rounded-xl"
                            hx-get="/contact/search"
                            hx-trigger="input changed delay:400ms, search"
                            hx-target="#search-user-results"
                        />
                    </div>

                    <div
                        id="search-user-results"
                        class="max-h-56 overflow-y-auto space-y-2 custom-scrollbar"
                    >
                        <p class="text-xs text-base-content/50">
                            Ketik minimal 3 karakter username atau ID 6 digit.
                        </p>
                    </div>

                    <div class="divider text-[11px] text-base-content/50 my-2">ATAU</div>

                    <div
                        class="flex items-center justify-between gap-2 bg-base-100/80 border border-base-300/80 p-3 rounded-xl"
                        x-data={`{ invitePath: '/contact/invite/${user.id}', copied: false }`}
                    >
                        <div class="truncate text-xs">
                            <p class="font-semibold">Link Undangan Anda</p>
                            <p
                                class="text-base-content/60 font-mono truncate mt-0.5"
                                x-text="window.location.origin + invitePath"
                            ></p>
                        </div>
                        <button
                            type="button"
                            class="btn btn-outline btn-xs rounded-lg shrink-0"
                            x-on:click="
                                navigator.clipboard.writeText(window.location.origin + invitePath);
                                copied = true;
                                setTimeout(() => copied = false, 2000);
                            "
                            x-text="copied ? 'Tersalin!' : 'Salin Link'"
                        ></button>
                    </div>

                    <div class="modal-action">
                        <button
                            type="button"
                            onclick="add_contact_modal.close()"
                            class="btn btn-ghost btn-sm rounded-xl"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </Layout>
    );
};

export function ContactList({ contacts }: { contacts: RequestFriendship[] }) {
    return (
        <>
            {contacts.length === 0 ? (
                <div class="text-center p-6 text-base-content/50 text-xs">
                    Tidak ada permintaan pertemanan masuk.
                </div>
            ) : (
                contacts.map((contact) => (
                    <div
                        x-show={`!search || '${contact.username}'.toLowerCase().includes(search.toLowerCase()) || '${contact.oppositeId}'.includes(search)`}
                        class="flex items-center justify-between p-2.5 rounded-xl bg-base-100/60 border border-base-300/70 transition w-full"
                    >
                        <div class="flex items-center gap-2.5 min-w-0">
                            <UserAvatar
                                username={contact.username}
                                avatarUrl={contact.avatarUrl}
                                size="sm"
                                variant="accent"
                            />
                            <div class="min-w-0 text-left">
                                <h3 class="font-semibold text-sm truncate">{contact.username}</h3>
                                <span class="text-[11px] font-mono text-base-content/50 block truncate">
                                    ID: {contact.oppositeId}
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                class="btn btn-success btn-xs rounded-lg text-white"
                                title="Terima Permintaan"
                                hx-confirm={`Terima permintaan pertemanan dari ${contact.username}?`}
                                hx-patch="/contact"
                                hx-vals={`{"id": "${contact.oppositeId}", "status": "accepted"}`}
                            >
                                Konfirmasi
                            </button>
                            <button
                                type="button"
                                class="btn btn-ghost btn-xs rounded-lg text-error"
                                title="Tolak Permintaan"
                                hx-confirm={`Tolak permintaan pertemanan dari ${contact.username}?`}
                                hx-patch="/contact"
                                hx-vals={`{"id": "${contact.oppositeId}", "status": "rejected"}`}
                            >
                                Tolak
                            </button>
                        </div>
                    </div>
                ))
            )}
        </>
    );
}

export function SearchUserResults({
    results,
    hint,
}: {
    results: UserSearchResult[];
    hint?: string;
}) {
    if (hint) {
        return <p class="text-xs text-base-content/60 py-2">{hint}</p>;
    }

    if (results.length === 0) {
        return <p class="text-xs text-base-content/60 py-2">Pengguna tidak ditemukan.</p>;
    }

    return (
        <div class="space-y-1.5">
            {results.map((item) => (
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-base-100/80 border border-base-300/70">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                            username={item.username}
                            avatarUrl={item.avatarUrl}
                            size="xs"
                            variant="primary"
                        />
                        <div class="min-w-0">
                            <p class="font-semibold text-sm truncate">{item.username}</p>
                            <span class="text-[11px] font-mono text-base-content/50">
                                ID: {item.id}
                            </span>
                        </div>
                    </div>

                    {item.relationStatus === 'none' && (
                        <button
                            type="button"
                            class="btn btn-primary btn-xs rounded-lg shrink-0"
                            hx-post="/contact"
                            hx-target="#modal-alert-message"
                            hx-vals={`{"id": "${item.id}"}`}
                        >
                            Tambah Teman
                        </button>
                    )}
                    {item.relationStatus === 'pending_outgoing' && (
                        <span class="badge badge-ghost badge-sm rounded-lg">Menunggu</span>
                    )}
                    {item.relationStatus === 'pending_incoming' && (
                        <button
                            type="button"
                            class="btn btn-success btn-xs rounded-lg text-white shrink-0"
                            hx-patch="/contact"
                            hx-vals={`{"id": "${item.id}", "status": "accepted"}`}
                        >
                            Terima
                        </button>
                    )}
                    {item.relationStatus === 'accepted' && (
                        <span class="badge badge-success badge-sm rounded-lg text-white">
                            Berteman
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
