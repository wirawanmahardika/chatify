import { Html } from '@elysiajs/html';
import type { RoomWithDetails } from '../model';
import { Layout, type Scripts } from '../../../shared/views/layout';
import type { User } from '../../auth/model';
import { UserAvatar } from '../../../shared/components/avatar';
import {
    DesktopNavigation,
    MobileNavigation,
    ThemeToggleButton,
} from '../../../shared/components/navigation';

export const ChatPage = ({
    userRooms,
    user,
    availableUsers,
}: {
    user: User;
    userRooms: RoomWithDetails[];
    availableUsers: { id: string; username: string }[];
}) => {
    const scripts: Scripts = {
        alpine: true,
        htmx: true,
        htmxWebSocket: true,
        customScript: [{ src: '/public/js/chat-page.js', defer: true }],
    };

    return (
        <Layout title="Obrolan" script={scripts}>
            <div
                x-data="{ activeRoomId: null, roomSearch: '', groupInfoOpen: false }"
                class="bg-base-100 h-screen flex flex-col md:flex-row overflow-hidden text-base-content"
            >
                <div
                    hx-ws:connect="/ws"
                    class="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative"
                >
                    <DesktopNavigation />

                    {/* Left Sidebar - Conversations */}
                    <aside class="w-full md:w-80 lg:w-85 border-r border-base-300/80 flex flex-col bg-base-200/40 shrink-0 h-full pb-16 md:pb-0">
                        {/* User Mini Profile Header */}
                        <div class="px-4 py-3.5 border-b border-base-300/80 flex justify-between items-center bg-base-200/60">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="relative shrink-0">
                                    <UserAvatar
                                        username={user.username}
                                        avatarUrl={user.avatarUrl}
                                        size="md"
                                        variant="gradient"
                                    />
                                    <span class="w-2.5 h-2.5 rounded-full bg-success border-2 border-base-200 absolute -bottom-0.5 -right-0.5"></span>
                                </div>
                                <div class="min-w-0">
                                    <h2 class="font-bold text-sm truncate leading-tight">
                                        {user.username}
                                    </h2>
                                    <button
                                        type="button"
                                        x-data={`{ id: '${user.id}', copied: false }`}
                                        x-on:click="navigator.clipboard.writeText(id); copied = true; setTimeout(() => copied = false, 1800)"
                                        class="text-[11px] font-mono text-base-content/60 hover:text-primary flex items-center gap-1 mt-0.5 cursor-pointer transition"
                                        title="Salin ID Pengguna"
                                    >
                                        <span x-text="copied ? 'ID Tersalin!' : '#' + id"></span>
                                    </button>
                                </div>
                            </div>

                            <div class="flex items-center gap-1">
                                <ThemeToggleButton class="md:hidden" />
                                <a
                                    href="/auth/logout"
                                    class="btn btn-ghost btn-square btn-sm rounded-xl text-error/80 hover:text-error hover:bg-error/10 md:hidden"
                                    title="Logout"
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
                                </a>
                            </div>
                        </div>

                        {/* Section Title & Quick Actions */}
                        <div class="px-4 pt-3.5 pb-2.5 space-y-2.5">
                            <div class="flex justify-between items-center">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                                    Percakapan ({userRooms.length})
                                </span>
                                <div class="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onclick="create_group_modal.showModal()"
                                        class="btn btn-ghost btn-xs rounded-lg border border-base-300/80 hover:border-primary/40 gap-1 font-medium"
                                        title="Buat Grup Baru"
                                    >
                                        + Grup
                                    </button>
                                    <button
                                        type="button"
                                        onclick="new_chat_modal.showModal()"
                                        class="btn btn-primary btn-xs rounded-lg gap-1 shadow-sm shadow-primary/20 font-medium"
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
                                        Obrolan
                                    </button>
                                </div>
                            </div>

                            {/* Room Filter */}
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
                                    x-model="roomSearch"
                                    class="grow text-xs"
                                    placeholder="Cari percakapan..."
                                />
                            </label>
                        </div>

                        {/* Rooms List */}
                        <div class="flex-1 overflow-y-auto px-2.5 pb-3 space-y-1 custom-scrollbar">
                            {userRooms.length === 0 ? (
                                <div class="text-center px-6 py-12 text-base-content/50 text-xs space-y-2">
                                    <p class="font-medium text-base-content/70">
                                        Belum ada percakapan
                                    </p>
                                    <p>
                                        Klik <strong>"+ Obrolan"</strong> untuk memulai chat baru.
                                    </p>
                                </div>
                            ) : (
                                userRooms.map((room) => {
                                    const title =
                                        room.type === 'group'
                                            ? room.name || 'Grup'
                                            : room.opponentName || room.name || 'Direct Message';
                                    const lastMsg = room.lastMessage
                                        ? room.lastMessage.content
                                        : 'Belum ada pesan';
                                    const safeTitle = title.replace(/'/g, "\\'");

                                    return (
                                        <button
                                            type="button"
                                            hx-get={`/room/${room.id}`}
                                            hx-target="#chat-panel"
                                            hx-swap="outerHTML"
                                            {...{ 'hx-on:htmx:after:request': 'scrollToBottom()' }}
                                            x-show={`!roomSearch || '${safeTitle}'.toLowerCase().includes(roomSearch.toLowerCase())`}
                                            x-on:click={`activeRoomId = '${room.id}'; groupInfoOpen = false; window.__activeRoomId = '${room.id}'; clearUnreadBadge('${room.id}')`}
                                            x-bind:class={`activeRoomId === '${room.id}' ? 'bg-primary/15 border-primary/35 text-base-content shadow-sm' : 'border-transparent hover:bg-base-300/40 text-base-content'`}
                                            class="flex items-center gap-3 p-2.5 rounded-xl border transition-all w-full text-left cursor-pointer"
                                        >
                                            <div class="relative shrink-0">
                                                <UserAvatar
                                                    username={title}
                                                    avatarUrl={room.type === 'direct' ? room.opponentAvatarUrl : null}
                                                    size="md"
                                                    variant="neutral"
                                                />
                                                {room.type === 'direct' && room.opponentId && (
                                                    <span
                                                        id={`presence-dot-${room.opponentId}`}
                                                        class={`w-2.5 h-2.5 rounded-full border-2 border-base-100 absolute -bottom-0.5 -right-0.5 ${room.isOpponentOnline ? 'bg-success' : 'bg-base-content/30'}`}
                                                    ></span>
                                                )}
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="flex justify-between items-center gap-2">
                                                    <h3 class="font-semibold text-sm truncate flex items-center gap-1.5">
                                                        {room.type === 'group' && (
                                                            <span class="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-accent/15 text-accent shrink-0">
                                                                Grup
                                                            </span>
                                                        )}
                                                        <span class="truncate">{title}</span>
                                                    </h3>
                                                    <span
                                                        id={`unread-badge-${room.id}`}
                                                        class={`px-1.5 min-w-4.5 h-4.5 rounded-full bg-primary text-primary-content text-[10px] font-bold inline-flex items-center justify-center shrink-0 ${room.unreadCount > 0 ? '' : 'hidden'}`}
                                                    >
                                                        {room.unreadCount}
                                                    </span>
                                                </div>
                                                <p
                                                    id={room.id}
                                                    class="text-xs text-base-content/60 truncate mt-0.5"
                                                >
                                                    {room.lastMessage?.sender === room.opponentId
                                                        ? (room.opponentName || '') + ': '
                                                        : room.lastMessage?.content &&
                                                            room.type === 'direct'
                                                          ? 'Anda: '
                                                          : ''}
                                                    {lastMsg}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    {/* Center Panel - Chat Workspace */}
                    <div
                        id="chat-panel"
                        class="hidden md:flex flex-1 flex-col h-full bg-base-100 overflow-hidden w-full relative"
                    >
                        <div class="pointer-events-none absolute inset-0 bg-ambient-grid opacity-30"></div>
                        <div class="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div class="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/20 to-accent/20 border border-primary/25 text-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke-width="1.5"
                                    stroke="currentColor"
                                    class="w-8 h-8"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.85l1.052-3.76-A8.967 8.967 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                                    />
                                </svg>
                            </div>
                            <h2 class="text-xl font-bold tracking-tight mb-2">
                                Selamat Datang di Chatify
                            </h2>
                            <p class="text-base-content/60 max-w-sm mb-6 text-xs leading-relaxed">
                                Pilih percakapan dari panel di sebelah kiri atau mulai obrolan
                                pribadi maupun grup baru secara real-time.
                            </p>
                            <div class="flex flex-wrap items-center justify-center gap-2.5">
                                <button
                                    type="button"
                                    onclick="new_chat_modal.showModal()"
                                    class="btn btn-primary btn-sm rounded-xl shadow-md shadow-primary/20"
                                >
                                    Mulai Obrolan Baru
                                </button>
                                <button
                                    type="button"
                                    onclick="create_group_modal.showModal()"
                                    class="btn btn-ghost btn-sm rounded-xl border border-base-300"
                                >
                                    Buat Grup
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Slide-Over Drawer - Group Info & Members */}
                    <div
                        x-show="groupInfoOpen"
                        x-cloak
                        x-on:click="groupInfoOpen = false"
                        class="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden"
                    ></div>
                    <aside
                        id="group-info-drawer"
                        x-show="groupInfoOpen"
                        x-cloak
                        class="fixed right-0 top-0 bottom-0 w-full max-w-xs sm:w-80 lg:static lg:w-80 bg-base-200/95 lg:bg-base-200/60 backdrop-blur-xl border-l border-base-300/80 z-40 flex flex-col shrink-0 shadow-2xl lg:shadow-none"
                    >
                        <div class="px-4 py-3.5 border-b border-base-300/80 flex items-center justify-between">
                            <span class="text-xs font-bold uppercase tracking-wider text-base-content/70">
                                Detail & Anggota Grup
                            </span>
                            <button
                                type="button"
                                x-on:click="groupInfoOpen = false"
                                class="btn btn-ghost btn-xs btn-square rounded-lg"
                                aria-label="Tutup panel grup"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke-width="2"
                                    stroke="currentColor"
                                    class="w-4 h-4"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div
                            id="group-members-content"
                            class="flex-1 overflow-y-auto p-4 custom-scrollbar"
                        >
                            <p class="text-xs text-base-content/60">Memuat anggota grup...</p>
                        </div>
                    </aside>
                </div>

                <MobileNavigation hideWhen="!activeRoomId" />
            </div>

            {/* Modal - New Chat Selection */}
            <dialog id="new_chat_modal" class="modal">
                <div class="modal-box bg-base-200 border border-base-300 rounded-2xl shadow-2xl">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-base">Mulai Obrolan Langsung</h3>
                        <form method="dialog">
                            <button class="btn btn-ghost btn-xs btn-square rounded-lg">✕</button>
                        </form>
                    </div>
                    <div class="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {availableUsers.length === 0 ? (
                            <p class="text-xs text-base-content/60 text-center py-6">
                                Tidak ada kontak yang tersedia. Tambahkan teman terlebih dahulu di
                                menu Kontak.
                            </p>
                        ) : (
                            availableUsers.map((u) => (
                                <form
                                    method="POST"
                                    action="/direct"
                                    class="flex items-center justify-between p-2.5 rounded-xl bg-base-100/70 hover:bg-base-100 border border-base-300/70 transition"
                                >
                                    <input type="hidden" name="targetUserId" value={u.id} />
                                    <div class="flex items-center gap-3 min-w-0">
                                        <div class="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span class="font-semibold text-sm truncate">
                                            {u.username}
                                        </span>
                                    </div>
                                    <button
                                        type="submit"
                                        class="btn btn-primary btn-xs rounded-lg"
                                    >
                                        Kirim Pesan
                                    </button>
                                </form>
                            ))
                        )}
                    </div>
                    <div class="modal-action mt-4">
                        <form method="dialog">
                            <button class="btn btn-ghost btn-sm rounded-xl">Batal</button>
                        </form>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            {/* Modal - Create Group */}
            <dialog id="create_group_modal" class="modal">
                <div class="modal-box bg-base-200 border border-base-300 rounded-2xl shadow-2xl">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-base">Buat Grup Baru</h3>
                        <button
                            type="button"
                            onclick="create_group_modal.close()"
                            class="btn btn-ghost btn-xs btn-square rounded-lg"
                        >
                            ✕
                        </button>
                    </div>
                    <form method="POST" action="/group" class="space-y-4">
                        <div class="form-control gap-1.5">
                            <label class="text-xs font-semibold text-base-content/80">
                                Nama Grup
                            </label>
                            <input
                                type="text"
                                name="name"
                                minlength="2"
                                maxlength="50"
                                placeholder="Contoh: Tim Produk"
                                class="input input-bordered bg-base-100 w-full rounded-xl text-sm"
                                required
                            />
                        </div>
                        <div class="form-control gap-1.5">
                            <label class="text-xs font-semibold text-base-content/80">
                                Pilih Anggota Awal
                            </label>
                            <div class="max-h-44 overflow-y-auto space-y-1 bg-base-100/70 border border-base-300/80 rounded-xl p-2 custom-scrollbar">
                                {availableUsers.length === 0 ? (
                                    <p class="text-xs text-base-content/60 text-center py-3">
                                        Belum ada kontak untuk ditambahkan.
                                    </p>
                                ) : (
                                    availableUsers.map((contact) => (
                                        <label class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-base-200 cursor-pointer transition">
                                            <input
                                                type="checkbox"
                                                name="memberIds"
                                                value={contact.id}
                                                class="checkbox checkbox-primary checkbox-xs rounded"
                                            />
                                            <span class="text-sm">{contact.username}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                        <div class="modal-action">
                            <button
                                type="button"
                                onclick="create_group_modal.close()"
                                class="btn btn-ghost btn-sm rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                class="btn btn-primary btn-sm rounded-xl shadow-md shadow-primary/20"
                            >
                                Buat Grup
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            <div id="toast-container" class="toast toast-end toast-top z-50"></div>
        </Layout>
    );
};
