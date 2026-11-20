import { Html } from '@elysiajs/html';
import type {
    MessageType,
    MessageWithUser,
    RequestFriendship,
    RoomType,
    RoomWithDetails,
    UserSearchResult,
} from './model';
import { Layout, type Scripts } from '../../shared/views/layout';
import type { User } from '../auth/model';
import { UserAvatar } from '../../shared/components/avatar';
import {
    DesktopNavigation,
    MobileNavigation,
    ThemeToggleButton,
} from '../../shared/components/navigation';

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
                                    const initial = title.charAt(0).toUpperCase();
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

function renderMessageContent(
    type: MessageType,
    content: string,
    attachmentUrl?: string | null,
    attachmentName?: string | null
) {
    if (type === 'image' && attachmentUrl) {
        return (
            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" class="block">
                <img
                    src={attachmentUrl}
                    alt={attachmentName || content}
                    class="max-w-xs max-h-64 rounded-xl object-cover border border-base-300/50"
                    loading="lazy"
                />
            </a>
        );
    }

    if (type === 'file' && attachmentUrl) {
        return (
            <a
                href={attachmentUrl}
                download={attachmentName || content}
                class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-black/10 hover:bg-black/20 transition font-medium text-xs"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.75"
                    stroke="currentColor"
                    class="w-4 h-4 shrink-0"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                    />
                </svg>
                <span class="truncate max-w-52 underline">{attachmentName || content}</span>
            </a>
        );
    }

    return <span class="whitespace-pre-wrap wrap-break-word">{content}</span>;
}

export const TypingPartial = (roomId: string, username: string, isTyping: boolean) => {
    return (
        <div id={`typing-indicator-${roomId}`} hx-swap-oob="innerHTML">
            {isTyping ? `${username} sedang mengetik...` : ''}
        </div>
    );
};

export const PresencePartial = (userId: string, isOnline: boolean) => {
    return (
        <>
            <span
                id={`presence-dot-${userId}`}
                hx-swap-oob="outerHTML"
                class={`w-2.5 h-2.5 rounded-full border-2 border-base-100 absolute -bottom-0.5 -right-0.5 ${isOnline ? 'bg-success' : 'bg-base-content/30'}`}
            ></span>
            <span
                id={`presence-panel-${userId}`}
                hx-swap-oob="outerHTML"
                class={`text-[11px] flex items-center gap-1.5 mt-0.5 ${isOnline ? 'text-success' : 'text-base-content/50'}`}
            >
                <span
                    class={`w-1.5 h-1.5 rounded-full inline-block ${isOnline ? 'bg-success' : 'bg-base-content/40'}`}
                ></span>
                {isOnline ? 'Online' : 'Offline'}
            </span>
        </>
    );
};

export const ChatPartial = ({
    isSelf = false,
    username,
    content,
    roomId,
    createdAt,
    type = 'text',
    attachmentUrl,
    attachmentName,
}: {
    isSelf?: boolean;
    username: string;
    content: string;
    roomId: string;
    createdAt: Date;
    type?: MessageType;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
}) => {
    const preview =
        type === 'image' ? '📷 Gambar' : type === 'file' ? `📎 ${attachmentName || content}` : content;

    return (
        <>
            <div id={'chat-' + roomId} hx-swap-oob="beforeend">
                <div
                    class={`flex flex-col chat-animate-in ${isSelf ? 'items-end' : 'items-start'}`}
                    data-ws-msg="true"
                    data-room-id={roomId}
                    data-sender={username}
                    data-preview={preview}
                    data-is-self={isSelf ? 'true' : 'false'}
                >
                    <span class="text-[11px] font-medium text-base-content/50 mb-1 px-1">
                        {isSelf ? 'Anda' : username}
                    </span>
                    <div
                        class={`max-w-[80%] sm:max-w-[68%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                            isSelf
                                ? 'bg-primary text-primary-content rounded-2xl rounded-br-sm shadow-primary/15'
                                : 'bg-base-200 border border-base-300/80 text-base-content rounded-2xl rounded-bl-sm'
                        }`}
                    >
                        {renderMessageContent(type, content, attachmentUrl, attachmentName)}
                    </div>
                    <div
                        x-data={`{ time: '${createdAt.toISOString()}' }`}
                        x-text="formatChatTime(time)"
                        class="text-[10px] text-base-content/45 mt-1 px-1"
                    ></div>
                </div>
            </div>
            <p id={roomId} hx-swap-oob="innerHTML">
                {isSelf ? 'Anda' : username}: {preview}
            </p>
        </>
    );
};

export const Chats = (
    userId: string,
    messages: {
        senderId: string;
        sender: string;
        type?: MessageType;
        content: string;
        attachmentUrl?: string | null;
        attachmentName?: string | null;
        createdAt: Date;
    }[]
) => {
    return (
        <>
            {messages.reverse().map((m) => {
                const isSelf = m.senderId === userId;
                return (
                    <div
                        class={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                        data-created-at={m.createdAt.toISOString()}
                    >
                        <span class="text-[11px] font-medium text-base-content/50 mb-1 px-1">
                            {isSelf ? 'Anda' : m.sender}
                        </span>
                        <div
                            class={`max-w-[80%] sm:max-w-[68%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                                isSelf
                                    ? 'bg-primary text-primary-content rounded-2xl rounded-br-sm shadow-primary/15'
                                    : 'bg-base-200 border border-base-300/80 text-base-content rounded-2xl rounded-bl-sm'
                            }`}
                        >
                            {renderMessageContent(
                                m.type ?? 'text',
                                m.content,
                                m.attachmentUrl,
                                m.attachmentName
                            )}
                        </div>
                        <div
                            x-data={`{ time: '${m.createdAt.toISOString()}' }`}
                            x-text="formatChatTime(time)"
                            class="text-[10px] text-base-content/45 mt-1 px-1"
                        ></div>
                    </div>
                );
            })}
        </>
    );
};

export const ChatPanel = ({
    username,
    messages,
    room,
}: {
    username: string;
    messages: MessageWithUser[];
    room: {
        id: string;
        name: string;
        type: RoomType;
        opponentId: string;
        opponentName: string;
        opponentAvatarUrl?: string | null;
        isOpponentOnline: boolean;
        memberCount: number;
    };
}) => {
    const title =
        room.type === 'group'
            ? room.name || 'Grup'
            : room.opponentName || room.name || 'Direct Message';

    return (
        <div
            id="chat-panel"
            x-ref="chatPanel"
            class="flex-1 flex flex-col h-full bg-base-100 overflow-hidden w-full fixed inset-0 z-20 md:static"
        >
            {/* Chat Header */}
            <header class="px-4 py-3 bg-base-200/70 backdrop-blur-md border-b border-base-300/80 flex justify-between items-center z-10 shrink-0">
                <div class="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        x-on:click="$refs.chatPanel.innerHTML = ''; activeRoomId = null; groupInfoOpen = false; window.__activeRoomId = null;"
                        class="btn btn-ghost btn-square btn-sm rounded-xl md:hidden"
                        aria-label="Kembali ke daftar percakapan"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                            class="w-5 h-5"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                        </svg>
                    </button>
                    <UserAvatar
                        username={title}
                        avatarUrl={room.type === 'direct' ? room.opponentAvatarUrl : null}
                        size="md"
                        variant="primary"
                        class="border border-primary/20"
                    />
                    <div class="min-w-0">
                        <h1 class="font-bold text-sm sm:text-base leading-tight truncate">
                            {title}
                        </h1>
                        {room.type === 'group' ? (
                            <span class="text-[11px] text-base-content/60 flex items-center gap-1 mt-0.5">
                                {room.memberCount} anggota
                            </span>
                        ) : (
                            <span
                                id={`presence-panel-${room.opponentId}`}
                                class={`text-[11px] flex items-center gap-1.5 mt-0.5 ${room.isOpponentOnline ? 'text-success' : 'text-base-content/50'}`}
                            >
                                <span
                                    class={`w-1.5 h-1.5 rounded-full inline-block ${room.isOpponentOnline ? 'bg-success' : 'bg-base-content/40'}`}
                                ></span>
                                {room.isOpponentOnline ? 'Online' : 'Offline'}
                            </span>
                        )}
                    </div>
                </div>

                {room.type === 'group' && (
                    <button
                        type="button"
                        class="btn btn-ghost btn-xs sm:btn-sm rounded-xl border border-base-300 hover:border-primary/40 gap-1.5"
                        hx-get={`/group/${room.id}/members`}
                        hx-target="#group-members-content"
                        x-on:click="groupInfoOpen = true"
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
                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                            />
                        </svg>
                        <span>Anggota</span>
                    </button>
                )}
            </header>

            {/* Chat Window */}
            <div
                id={'chat-' + room.id}
                class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 bg-base-100 custom-scrollbar"
                chat-window
            >
                <div id="message-loader" class="w-full grid place-items-center py-2">
                    <button
                        id="message-loader-btn"
                        type="button"
                        x-init={`$el.disabled = ${messages.length > 0 ? 'false' : 'true'}`}
                        class="btn btn-ghost btn-xs rounded-full border border-base-300/80 text-base-content/70 hover:text-base-content disabled:opacity-40"
                        hx-get={`/messages/${room.id}`}
                        hx-target="#message-loader"
                        hx-swap="afterend"
                        {...{
                            'hx-on:htmx:config:request':
                                "const beforeDate = htmx.find('#message-loader')?.nextElementSibling?.dataset?.createdAt; if (beforeDate) event.detail.ctx.request.body.set('beforeDate', beforeDate);",
                        }}
                    >
                        {messages.length > 0
                            ? 'Lihat percakapan sebelumnya'
                            : 'Tidak ada lagi pesan'}
                    </button>
                </div>

                {messages
                    .slice()
                    .reverse()
                    .map((m) => {
                        const isSelf = m.username === username;
                        return (
                            <div
                                data-created-at={m.createdAt}
                                class={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                            >
                                <span class="text-[11px] font-medium text-base-content/50 mb-1 px-1">
                                    {isSelf ? 'Anda' : m.username}
                                </span>
                                <div
                                    class={`max-w-[80%] sm:max-w-[68%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                                        isSelf
                                            ? 'bg-primary text-primary-content rounded-2xl rounded-br-sm shadow-primary/15'
                                            : 'bg-base-200 border border-base-300/80 text-base-content rounded-2xl rounded-bl-sm'
                                    }`}
                                >
                                    {renderMessageContent(
                                        m.type ?? 'text',
                                        m.content,
                                        m.attachmentUrl,
                                        m.attachmentName
                                    )}
                                </div>
                                <div
                                    x-data={`{ time: '${m.createdAt.toISOString()}' }`}
                                    x-text="formatChatTime(time)"
                                    class="text-[10px] text-base-content/45 mt-1 px-1"
                                ></div>
                            </div>
                        );
                    })}
            </div>

            {/* Typing Indicator & Upload Alert */}
            <div
                id={`typing-indicator-${room.id}`}
                class="px-5 py-1 text-[11px] italic text-primary min-h-5 bg-base-100"
            ></div>
            <div id="upload-alert" class="px-4"></div>

            {/* Message Composer */}
            <div class="px-4 py-3 bg-base-200/50 border-t border-base-300/80 flex gap-2 items-center shrink-0">
                <form
                    hx-post={`/room/${room.id}/upload`}
                    hx-encoding="multipart/form-data"
                    hx-target="#upload-alert"
                    hx-trigger="change"
                    {...{
                        'hx-status:400': 'swap:innerHTML',
                        'hx-status:403': 'swap:innerHTML',
                        'hx-status:500': 'swap:innerHTML',
                    }}
                >
                    <label
                        class="btn btn-ghost btn-square btn-sm rounded-xl text-base-content/70 hover:text-primary hover:bg-primary/10 cursor-pointer"
                        title="Kirim Gambar atau File (maks. 5 MB)"
                    >
                        <input
                            type="file"
                            name="file"
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/zip"
                            class="hidden"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.75"
                            stroke="currentColor"
                            class="w-5 h-5"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                            />
                        </svg>
                    </label>
                </form>

                <form id="form" class="flex-1 flex gap-2 items-center" hx-ws:send>
                    <input type="hidden" name="type" value="chatting" />
                    <input type="hidden" name="roomId" value={room.id} />
                    <input
                        id="input-message"
                        type="text"
                        name="message"
                        data-room-id={room.id}
                        class="input bg-base-100 border-base-300 focus:border-primary focus:outline-none flex-1 rounded-xl text-sm"
                        autocomplete="off"
                        required
                        placeholder="Tulis pesan..."
                    />
                    <button
                        type="submit"
                        class="btn btn-primary rounded-xl px-4 sm:px-5 shadow-md shadow-primary/20 gap-1.5"
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
                                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                        </svg>
                        <span class="hidden sm:inline">Kirim</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

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

export function InvitePage({
    user,
    target,
    isSelf,
}: {
    user: User;
    target: UserSearchResult | null;
    isSelf: boolean;
}) {
    return (
        <Layout
            title="Undangan Pertemanan"
            script={{ htmx: true, alpine: true }}
            class="bg-base-100 text-base-content min-h-screen antialiased relative overflow-x-hidden"
        >
            <div class="pointer-events-none fixed inset-0 bg-ambient-grid opacity-40"></div>
            <div class="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-140 h-95 rounded-full bg-primary/15 blur-[120px]"></div>

            <div class="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div class="w-full max-w-md rounded-2xl bg-base-200/85 backdrop-blur-xl border border-base-300/90 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                    {isSelf ? (
                        <>
                            <div class="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xl">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <h2 class="text-xl font-bold">Link Undangan Anda</h2>
                            <p class="text-xs text-base-content/70 leading-relaxed">
                                Bagikan link ini kepada teman agar mereka dapat menambahkan{' '}
                                <strong>{user.username}</strong> (ID: {user.id}).
                            </p>
                            <a href="/contact" class="btn btn-primary btn-sm rounded-xl mt-2">
                                Kembali ke Kontak
                            </a>
                        </>
                    ) : !target ? (
                        <>
                            <h2 class="text-xl font-bold text-error">Undangan Tidak Ditemukan</h2>
                            <p class="text-xs text-base-content/70">
                                Pengguna tidak ditemukan atau undangan tidak tersedia.
                            </p>
                            <a href="/contact" class="btn btn-ghost btn-sm rounded-xl mt-2">
                                Kembali ke Kontak
                            </a>
                        </>
                    ) : (
                        <>
                            <UserAvatar
                                username={target.username}
                                avatarUrl={target.avatarUrl}
                                size="lg"
                                variant="gradient"
                            />
                            <div>
                                <h2 class="text-xl font-bold">{target.username}</h2>
                                <p class="text-xs font-mono text-base-content/60 mt-0.5">
                                    ID: {target.id}
                                </p>
                            </div>

                            <div id="invite-alert" class="w-full"></div>

                            {target.relationStatus === 'none' && (
                                <button
                                    type="button"
                                    class="btn btn-primary w-full rounded-xl shadow-md shadow-primary/20"
                                    hx-post="/contact"
                                    hx-target="#invite-alert"
                                    hx-vals={`{"id": "${target.id}"}`}
                                >
                                    Kirim Permintaan Pertemanan
                                </button>
                            )}
                            {target.relationStatus === 'pending_outgoing' && (
                                <span class="badge badge-ghost rounded-lg py-3 px-4">
                                    Permintaan pertemanan sudah dikirim
                                </span>
                            )}
                            {target.relationStatus === 'pending_incoming' && (
                                <button
                                    type="button"
                                    class="btn btn-success text-white w-full rounded-xl"
                                    hx-patch="/contact"
                                    hx-vals={`{"id": "${target.id}", "status": "accepted"}`}
                                >
                                    Terima Permintaan Pertemanan
                                </button>
                            )}
                            {target.relationStatus === 'accepted' && (
                                <form method="POST" action="/direct" class="w-full">
                                    <input type="hidden" name="targetUserId" value={target.id} />
                                    <button type="submit" class="btn btn-primary w-full rounded-xl">
                                        Mulai Obrolan
                                    </button>
                                </form>
                            )}

                            <a href="/contact" class="btn btn-ghost btn-sm rounded-xl">
                                Kembali ke Kontak
                            </a>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export function GroupMembersModalContent({
    roomId,
    roomName,
    members,
    currentUserId,
    currentUserRole,
    addableContacts,
}: {
    roomId: string;
    roomName: string;
    members: { userId: string; username: string; avatarUrl?: string | null; role: string }[];
    currentUserId: string;
    currentUserRole: string;
    addableContacts: { id: string; username: string }[];
}) {
    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

    return (
        <div class="space-y-4">
            <div>
                <h3 class="font-bold text-base truncate">{roomName}</h3>
                <p class="text-[11px] text-base-content/60">{members.length} anggota terdaftar</p>
            </div>

            <div id="group-member-alert"></div>

            {canManage && addableContacts.length > 0 && (
                <form
                    hx-post={`/group/${roomId}/members`}
                    hx-target="#group-member-alert"
                    class="flex gap-2"
                >
                    <select
                        name="userId"
                        class="select select-bordered bg-base-100 select-sm flex-1 rounded-xl text-xs"
                        required
                    >
                        <option value="" disabled selected>
                            Tambah anggota...
                        </option>
                        {addableContacts.map((c) => (
                            <option value={c.id}>{c.username}</option>
                        ))}
                    </select>
                    <button type="submit" class="btn btn-primary btn-sm rounded-xl">
                        Tambah
                    </button>
                </form>
            )}

            <div class="space-y-1.5">
                {members.map((m) => (
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-base-100/70 border border-base-300/70">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <UserAvatar
                                username={m.username}
                                avatarUrl={m.avatarUrl}
                                size="xs"
                                variant="primary"
                            />
                            <div class="min-w-0">
                                <p class="text-sm font-semibold truncate">{m.username}</p>
                                <span class="text-[11px] text-base-content/60 capitalize">
                                    {m.role === 'owner'
                                        ? 'Pemilik'
                                        : m.role === 'admin'
                                          ? 'Admin'
                                          : 'Anggota'}
                                </span>
                            </div>
                        </div>

                        {m.userId === currentUserId ? (
                            <button
                                type="button"
                                class="btn btn-ghost btn-xs rounded-lg text-error hover:bg-error/10 shrink-0"
                                hx-confirm="Keluar dari grup ini?"
                                hx-delete={`/group/${roomId}/members/${m.userId}`}
                            >
                                Keluar
                            </button>
                        ) : (
                            canManage &&
                            m.role !== 'owner' && (
                                <button
                                    type="button"
                                    class="btn btn-ghost btn-xs rounded-lg text-error hover:bg-error/10 shrink-0"
                                    hx-confirm={`Keluarkan ${m.username} dari grup?`}
                                    hx-delete={`/group/${roomId}/members/${m.userId}`}
                                >
                                    Keluarkan
                                </button>
                            )
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
