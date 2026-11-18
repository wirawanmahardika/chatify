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
import { DesktopNavigation, MobileNavigation } from '../../shared/components/navigation';

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
                x-data={'{ activeRoomId: null  }'}
                class="bg-base-200 min-h-screen flex items-center justify-center font-sans text-base-content"
            >
                <div
                    hx-ws:connect="/ws"
                    class="w-full h-screen bg-base-100 md:rounded-2xl md:shadow-2xl flex flex-col md:flex-row border border-base-300 overflow-hidden"
                >
                    <DesktopNavigation />

                    {/* Left Sidebar */}
                    <div class="w-full md:w-80 lg:w-96 border-r border-base-300 flex flex-col bg-base-100 shrink-0 h-full md:flex!">
                        {/* Profile Header */}
                        <div class="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/50">
                            <div class="flex items-center gap-3">
                                <div class="avatar placeholder">
                                    <div class="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center font-bold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div class="overflow-hidden cursor-pointer">
                                    <h2 class="font-bold text-sm truncate">{user.username}</h2>

                                    <span
                                        class="text-[11px] text-success flex items-center gap-1"
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
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            class="size-4"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                                            />
                                        </svg>
                                        {user.id}
                                    </span>
                                </div>
                            </div>
                            <a
                                href="/auth/logout"
                                class="btn btn-ghost btn-circle btn-sm text-error"
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

                        {/* Direct Messages & Group Section Title & Actions */}
                        <div class="p-3 border-b border-base-300 flex justify-between items-center gap-1 bg-base-100">
                            <span class="text-xs font-bold uppercase tracking-wider text-base-content/60">
                                Percakapan
                            </span>
                            <div class="flex items-center gap-1">
                                <button
                                    onclick="create_group_modal.showModal()"
                                    class="btn btn-outline btn-xs gap-1"
                                    title="Buat Grup Baru"
                                >
                                    Grup
                                </button>
                                <button
                                    onclick="new_chat_modal.showModal()"
                                    class="btn btn-primary btn-xs gap-1"
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
                                    Obrolan Baru
                                </button>
                            </div>
                        </div>

                        {/* Rooms List */}
                        <div class="flex-1 overflow-y-auto p-2 space-y-1">
                            {userRooms.length === 0 ? (
                                <div class="text-center p-6 text-base-content/50 text-sm">
                                    Belum ada percakapan.
                                    <br />
                                    Klik <strong>"Obrolan Baru"</strong> untuk memulai.
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

                                    return (
                                        <button
                                            hx-get={`/room/${room.id}`}
                                            hx-target="#chat-panel"
                                            hx-swap="outerHTML"
                                            {...{ 'hx-on:htmx:after:request': 'scrollToBottom()' }}
                                            x-on:click={`activeRoomId = '${room.id}'; window.__activeRoomId = '${room.id}'; clearUnreadBadge('${room.id}')`}
                                            x-bind:class={`activeRoomId === '${room.id}' ? 'bg-primary text-primary-content shadow-md' : 'hover:bg-base-200 text-base-content'`}
                                            class="flex items-center gap-3 p-3 rounded-xl transition w-full"
                                        >
                                            <div class="avatar placeholder shrink-0 relative">
                                                <div
                                                    x-bind:class={`activeRoomId === '${room.id}' ? 'bg-primary-content text-primary' : 'bg-neutral text-neutral-content'`}
                                                    class="rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm"
                                                >
                                                    {initial}
                                                </div>
                                                {room.type === 'direct' && room.opponentId && (
                                                    <span
                                                        id={`presence-dot-${room.opponentId}`}
                                                        class={`w-2.5 h-2.5 rounded-full border-2 border-base-100 absolute bottom-0 right-0 ${room.isOpponentOnline ? 'bg-success' : 'bg-base-content/30'}`}
                                                    ></span>
                                                )}
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="flex justify-between items-center gap-2">
                                                    <h3 class="font-semibold text-sm truncate flex items-center gap-1.5">
                                                        {room.type === 'group' && (
                                                            <span class="badge badge-xs badge-ghost">
                                                                Grup
                                                            </span>
                                                        )}
                                                        <span class="truncate">{title}</span>
                                                    </h3>
                                                    <span
                                                        id={`unread-badge-${room.id}`}
                                                        class={`badge badge-error badge-xs text-white ${room.unreadCount > 0 ? '' : 'hidden'}`}
                                                    >
                                                        {room.unreadCount}
                                                    </span>
                                                </div>
                                                <p
                                                    id={room.id}
                                                    x-bind:class={`activeRoomId === '${room.id}' ? 'text-primary-content/80' : 'text-base-content/60'`}
                                                    class="text-xs truncate mt-0.5 text-left"
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
                    </div>
                    {/* Right Panel - Chat Panel */}
                    <div
                        id="chat-panel"
                        class="flex-1 flex flex-col h-full bg-base-100 overflow-hidden w-full empty:hidden"
                    >
                        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-base-200/20">
                            <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
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
                            <h2 class="text-xl font-bold mb-2">Selamat Datang di Chatify</h2>
                            <p class="text-base-content/60 max-w-sm mb-6 text-sm">
                                Pilih percakapan dari sidebar di sebelah kiri atau buat obrolan baru
                                untuk mulai berkomunikasi secara privat.
                            </p>
                            <button onclick="new_chat_modal.showModal()" class="btn btn-primary">
                                Mulai Obrolan Baru
                            </button>
                        </div>
                    </div>
                </div>

                <MobileNavigation />
            </div>

            {/* Modal - New Chat Selection */}
            <dialog id="new_chat_modal" class="modal">
                <div class="modal-box">
                    <h3 class="font-bold text-lg mb-4">Pilih Pengguna untuk Memulai DM</h3>
                    <div class="space-y-2 max-h-60 overflow-y-auto">
                        {availableUsers.length === 0 ? (
                            <p class="text-sm text-base-content/60 text-center py-4">
                                Tidak ada pengguna lain yang tersedia.
                            </p>
                        ) : (
                            availableUsers.map((user) => (
                                <form
                                    method="POST"
                                    action="/direct"
                                    class="flex items-center justify-between p-3 rounded-lg hover:bg-base-200 border border-base-300"
                                >
                                    <input type="hidden" name="targetUserId" value={user.id} />
                                    <div class="flex items-center gap-3">
                                        <div class="avatar placeholder">
                                            <div class="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <span class="font-semibold text-sm">{user.username}</span>
                                    </div>
                                    <button type="submit" class="btn btn-primary btn-sm">
                                        Kirim Pesan
                                    </button>
                                </form>
                            ))
                        )}
                    </div>
                    <div class="modal-action">
                        <form method="dialog">
                            <button class="btn btn-ghost btn-sm">Batal</button>
                        </form>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            {/* Modal - Create Group */}
            <dialog id="create_group_modal" class="modal">
                <div class="modal-box">
                    <h3 class="font-bold text-lg mb-4">Buat Grup Baru</h3>
                    <form method="POST" action="/group" class="space-y-4">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-semibold">Nama Grup</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                minlength="2"
                                maxlength="50"
                                placeholder="Contoh: Tim Proyek"
                                class="input input-bordered w-full"
                                required
                            />
                        </div>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-semibold">Pilih Anggota Awal</span>
                            </label>
                            <div class="max-h-44 overflow-y-auto space-y-1 border border-base-300 rounded-xl p-2">
                                {availableUsers.length === 0 ? (
                                    <p class="text-xs text-base-content/60 text-center py-2">
                                        Belum ada kontak untuk ditambahkan.
                                    </p>
                                ) : (
                                    availableUsers.map((contact) => (
                                        <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="memberIds"
                                                value={contact.id}
                                                class="checkbox checkbox-primary checkbox-xs"
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
                                class="btn btn-ghost btn-sm"
                            >
                                Batal
                            </button>
                            <button type="submit" class="btn btn-primary btn-sm">
                                Buat Grup
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            {/* Modal - Group Members */}
            <dialog id="group_members_modal" class="modal">
                <div id="group-members-content" class="modal-box">
                    <p class="text-sm text-base-content/60">Memuat anggota grup...</p>
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
                    class="max-w-xs max-h-64 rounded-lg object-cover"
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
                class="flex items-center gap-2 underline font-medium text-sm"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-4 h-4 shrink-0"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                    />
                </svg>
                <span class="truncate max-w-50">{attachmentName || content}</span>
            </a>
        );
    }

    return content;
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
                class={`w-2.5 h-2.5 rounded-full border-2 border-base-100 absolute bottom-0 right-0 ${isOnline ? 'bg-success' : 'bg-base-content/30'}`}
            ></span>
            <span
                id={`presence-panel-${userId}`}
                hx-swap-oob="outerHTML"
                class={`text-xs flex items-center gap-1 mt-0.5 ${isOnline ? 'text-success' : 'text-base-content/50'}`}
            >
                <span
                    class={`w-2 h-2 rounded-full inline-block ${isOnline ? 'bg-success' : 'bg-base-content/40'}`}
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
                    class={`chat ${isSelf ? 'chat-end' : 'chat-start'}`}
                    data-ws-msg="true"
                    data-room-id={roomId}
                    data-sender={username}
                    data-preview={preview}
                    data-is-self={isSelf ? 'true' : 'false'}
                >
                    <div class="chat-header text-xs opacity-70 mb-1">{username}</div>
                    <div
                        class={`chat-bubble max-w-[80%] ${isSelf ? 'chat-bubble-primary' : 'chat-bubble-neutral'}`}
                    >
                        {renderMessageContent(type, content, attachmentUrl, attachmentName)}
                    </div>
                    <div
                        x-data={`{ time: '${createdAt.toISOString()}' }`}
                        x-text="formatChatTime(time)"
                        class="chat-footer opacity-70 text-xs"
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
                        class={`chat ${isSelf ? 'chat-end' : 'chat-start'}`}
                        data-created-at={m.createdAt.toISOString()}
                    >
                        <div class="chat-header text-xs opacity-70 mb-1">{m.sender}</div>
                        <div
                            class={`chat-bubble max-w-[80%] ${
                                isSelf ? 'chat-bubble-primary' : 'chat-bubble-neutral'
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
                            class="chat-footer opacity-70 text-xs"
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
        isOpponentOnline: boolean;
        memberCount: number;
    };
}) => {
    const title = room.type === 'group' ? room.name || 'Grup' : room.opponentName || room.name || 'Direct Message';

    return (
        <div
            id={'chat-panel'}
            x-ref="chatPanel"
            class="flex-1 flex flex-col h-full bg-base-100 overflow-hidden w-full empty:hidden fixed md:static"
        >
            {/* Chat Header */}
            <header class="p-4 bg-base-100 border-b border-base-300 flex justify-between items-center z-10 shadow-sm">
                <div class="flex items-center gap-3">
                    <button
                        x-on:click="$refs.chatPanel.innerHTML = ''; activeRoomId = null; window.__activeRoomId = null;"
                        class="btn btn-ghost btn-circle btn-sm md:hidden"
                        aria-label="Kembali ke daftar percakapan"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                        </svg>
                    </button>
                    <div class="avatar placeholder">
                        <div class="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center font-bold">
                            {title.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div>
                        <h1 class="font-bold text-base leading-tight">{title}</h1>
                        {room.type === 'group' ? (
                            <span class="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
                                {room.memberCount} anggota
                            </span>
                        ) : (
                            <span
                                id={`presence-panel-${room.opponentId}`}
                                class={`text-xs flex items-center gap-1 mt-0.5 ${room.isOpponentOnline ? 'text-success' : 'text-base-content/50'}`}
                            >
                                <span
                                    class={`w-2 h-2 rounded-full inline-block ${room.isOpponentOnline ? 'bg-success' : 'bg-base-content/40'}`}
                                ></span>
                                {room.isOpponentOnline ? 'Online' : 'Offline'}
                            </span>
                        )}
                    </div>
                </div>

                {room.type === 'group' && (
                    <button
                        type="button"
                        class="btn btn-outline btn-xs"
                        hx-get={`/group/${room.id}/members`}
                        hx-target="#group-members-content"
                        onclick="group_members_modal.showModal()"
                    >
                        Anggota
                    </button>
                )}
            </header>

            {/* Chat Window (Scrollable Area) */}
            <div
                id={'chat-' + room.id}
                class="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/40"
                chat-window
            >
                <div id={'message-loader'} class={'w-full grid place-items-center'}>
                    <button
                        id="message-loader-btn"
                        x-init={`$el.disabled = ${messages.length > 0 ? 'false' : 'true'}`}
                        class="btn btn-info btn-dash btn-xs md:btn-md"
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
                                class={`chat ${isSelf ? 'chat-end' : 'chat-start'}`}
                            >
                                <div class="chat-header text-xs opacity-70 mb-1">{m.username}</div>
                                <div
                                    class={`chat-bubble max-w-[80%] ${
                                        isSelf ? 'chat-bubble-primary' : 'chat-bubble-neutral'
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
                                    class="chat-footer opacity-70 text-xs"
                                ></div>
                            </div>
                        );
                    })}
            </div>

            <div
                id={`typing-indicator-${room.id}`}
                class="px-4 py-1 text-xs italic text-base-content/60 min-h-5 bg-base-100"
            ></div>

            <div id="upload-alert" class="px-4"></div>

            {/* Footer / Input Form */}
            <div class="p-4 bg-base-100 border-t border-base-300 flex gap-2 items-center">
                <form
                    hx-post={`/room/${room.id}/upload`}
                    hx-encoding="multipart/form-data"
                    hx-target="#upload-alert"
                    hx-trigger="change from:find input[type=file]"
                >
                    <label
                        class="btn btn-ghost btn-circle btn-sm"
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
                            stroke-width="1.5"
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
                        class="input input-bordered input-primary flex-1 focus:outline-none"
                        autocomplete="off"
                        required
                        placeholder="Tulis pesan..."
                    />
                    <button type="submit" class="btn btn-primary px-6">
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
                                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                        </svg>
                        Kirim
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
                class="bg-base-200 min-h-screen flex items-center justify-center font-sans text-base-content"
            >
                <div class="w-full h-screen bg-base-100 md:rounded-2xl md:shadow-2xl flex flex-col md:flex-row border border-base-300 overflow-hidden">
                    <DesktopNavigation />

                    {/* Left Sidebar - Contacts Management List */}
                    <div class="w-full md:w-80 lg:w-96 border-r border-base-300 flex flex-col bg-base-100 shrink-0 h-full md:flex!">
                        {/* Profile Header */}
                        <div class="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/50">
                            <div class="flex items-center gap-3">
                                <div class="avatar placeholder">
                                    <div class="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center font-bold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div class="overflow-hidden cursor-pointer">
                                    <h2 class="font-bold text-sm truncate">{user.username}</h2>
                                    <span
                                        class="text-[11px] text-success flex items-center gap-1"
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
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            class="size-4"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                                            />
                                        </svg>
                                        {user.id}
                                    </span>
                                </div>
                            </div>
                            <a
                                href="/auth/logout"
                                class="btn btn-ghost btn-circle btn-sm text-error"
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

                        {/* Navigation Tabs (Kontak, Permintaan, Diblokir) */}
                        <div class="p-2 border-b border-base-300 grid grid-cols-3 gap-1 bg-base-100">
                            <button
                                x-on:click="activeTab = 'contacts'"
                                x-bind:class="activeTab === 'contacts' ? 'btn-primary' : 'btn-ghost'"
                                class="btn btn-xs rounded-lg"
                            >
                                Kontak ({contacts.length})
                            </button>
                            <button
                                x-on:click="activeTab = 'requests'"
                                x-bind:class="activeTab === 'requests' ? 'btn-primary' : 'btn-ghost'"
                                class="btn btn-xs rounded-lg relative"
                            >
                                Permintaan
                                {totalRequests > 0 && (
                                    <span class="badge badge-error badge-xs">{totalRequests}</span>
                                )}
                            </button>
                            <button
                                x-on:click="activeTab = 'blocked'"
                                x-bind:class="activeTab === 'blocked' ? 'btn-primary' : 'btn-ghost'"
                                class="btn btn-xs rounded-lg"
                            >
                                Diblokir ({blockedUsers.length})
                            </button>
                        </div>

                        {/* Direct Actions & Title */}
                        <div class="p-3 border-b border-base-300 flex justify-between items-center bg-base-100">
                            <span
                                x-text="activeTab === 'contacts' ? 'Daftar Kontak' : activeTab === 'requests' ? 'Permintaan Pertemanan' : 'Pengguna Diblokir'"
                                class="text-xs font-bold uppercase tracking-wider text-base-content/60"
                            ></span>
                            <button
                                onclick="add_contact_modal.showModal()"
                                class="btn btn-primary btn-xs gap-1"
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
                                Tambah Teman
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div class="p-3 border-b border-base-300 bg-base-100">
                            <label class="input input-sm input-bordered flex items-center gap-2">
                                <input
                                    type="text"
                                    x-model="search"
                                    class="grow text-xs"
                                    placeholder="Filter nama atau ID..."
                                />
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                    class="w-4 h-4 opacity-70"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </label>
                        </div>

                        {/* TAB 1: Saved Contacts List */}
                        <div
                            id="contacts"
                            hx-get="/contacts"
                            hx-trigger="updateContacts from:body"
                            x-show="activeTab === 'contacts'"
                            class="flex-1 overflow-y-auto p-2 space-y-1"
                        >
                            {contacts.length === 0 ? (
                                <div class="text-center p-6 text-base-content/50 text-sm">
                                    Belum ada kontak tersimpan.
                                </div>
                            ) : (
                                contacts.map((contact) => (
                                    <div
                                        x-show={`!search || '${contact.username}'.toLowerCase().includes(search.toLowerCase()) || '${contact.oppositeId}'.includes(search)`}
                                        class="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 transition w-full group"
                                    >
                                        <div class="flex items-center gap-3 truncate">
                                            <div class="avatar placeholder shrink-0">
                                                <div class="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                                                    {contact.username.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div class="truncate text-left">
                                                <h3 class="font-semibold text-sm truncate">
                                                    {contact.username}
                                                </h3>
                                                <span class="text-xs text-base-content/50 block truncate">
                                                    ID: {contact.oppositeId}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <form method="POST" action="/direct">
                                                <input
                                                    type="hidden"
                                                    name="targetUserId"
                                                    value={contact.oppositeId}
                                                />
                                                <button
                                                    type="submit"
                                                    class="btn btn-ghost btn-circle btn-xs text-primary"
                                                    title="Mulai Chat"
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
                                                            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.85l1.052-3.76-A8.967 8.967 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                                                        />
                                                    </svg>
                                                </button>
                                            </form>
                                            <button
                                                type="button"
                                                class="btn btn-ghost btn-circle btn-xs text-error"
                                                title="Blokir Pengguna"
                                                hx-confirm={`Blokir ${contact.username}? Anda tidak akan bisa saling mengirim pesan.`}
                                                hx-post="/contact/block"
                                                hx-vals={`{"id": "${contact.oppositeId}"}`}
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
                                                        d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* TAB 2: Friend Requests List (Incoming & Outgoing) */}
                        <div
                            id="friend-requests"
                            x-show="activeTab === 'requests'"
                            class="flex-1 overflow-y-auto p-2 space-y-3"
                        >
                            {totalRequests === 0 ? (
                                <div class="text-center p-6 text-base-content/50 text-sm">
                                    Tidak ada permintaan pertemanan.
                                </div>
                            ) : (
                                <>
                                    {incomingRequests.length > 0 && (
                                        <div class="space-y-1">
                                            <p class="px-2 text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                                                Permintaan Masuk ({incomingRequests.length})
                                            </p>
                                            {incomingRequests.map((req) => (
                                                <div
                                                    x-show={`!search || '${req.username}'.toLowerCase().includes(search.toLowerCase()) || '${req.oppositeId}'.includes(search)`}
                                                    class="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 transition w-full"
                                                >
                                                    <div class="flex items-center gap-3 truncate">
                                                        <div class="avatar placeholder shrink-0">
                                                            <div class="bg-accent text-accent-content rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                                                                {req.username.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div class="truncate text-left">
                                                            <h3 class="font-semibold text-sm truncate">
                                                                {req.username}
                                                            </h3>
                                                            <span class="text-xs text-base-content/50 block truncate">
                                                                ID: {req.oppositeId}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div class="flex items-center gap-1">
                                                        <button
                                                            class="btn btn-success btn-xs text-white"
                                                            title="Terima Permintaan"
                                                            hx-confirm={`Terima permintaan pertemanan dari ${req.username}?`}
                                                            hx-patch="/contact"
                                                            hx-vals={`{"id": "${req.oppositeId}", "status": "accepted"}`}
                                                        >
                                                            Terima
                                                        </button>
                                                        <button
                                                            class="btn btn-ghost btn-xs text-error"
                                                            title="Tolak Permintaan"
                                                            hx-confirm={`Tolak permintaan pertemanan dari ${req.username}?`}
                                                            hx-patch="/contact"
                                                            hx-vals={`{"id": "${req.oppositeId}", "status": "rejected"}`}
                                                        >
                                                            Tolak
                                                        </button>
                                                        <button
                                                            class="btn btn-ghost btn-xs text-warning"
                                                            title="Blokir"
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
                                        <div class="space-y-1">
                                            <p class="px-2 text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                                                Permintaan Terkirim ({outgoingRequests.length})
                                            </p>
                                            {outgoingRequests.map((req) => (
                                                <div
                                                    x-show={`!search || '${req.username}'.toLowerCase().includes(search.toLowerCase()) || '${req.oppositeId}'.includes(search)`}
                                                    class="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 transition w-full"
                                                >
                                                    <div class="flex items-center gap-3 truncate">
                                                        <div class="avatar placeholder shrink-0">
                                                            <div class="bg-base-300 text-base-content rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                                                                {req.username.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div class="truncate text-left">
                                                            <h3 class="font-semibold text-sm truncate">
                                                                {req.username}
                                                            </h3>
                                                            <span class="text-xs text-base-content/50 block truncate">
                                                                Menunggu konfirmasi
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        class="btn btn-ghost btn-xs text-error"
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

                        {/* TAB 3: Blocked Users List */}
                        <div
                            id="blocked-users"
                            x-show="activeTab === 'blocked'"
                            class="flex-1 overflow-y-auto p-2 space-y-1"
                        >
                            {blockedUsers.length === 0 ? (
                                <div class="text-center p-6 text-base-content/50 text-sm">
                                    Tidak ada pengguna yang diblokir.
                                </div>
                            ) : (
                                blockedUsers.map((blocked) => (
                                    <div
                                        x-show={`!search || '${blocked.username}'.toLowerCase().includes(search.toLowerCase()) || '${blocked.oppositeId}'.includes(search)`}
                                        class="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 transition w-full"
                                    >
                                        <div class="flex items-center gap-3 truncate">
                                            <div class="avatar placeholder shrink-0">
                                                <div class="bg-error/20 text-error rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                                                    {blocked.username.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div class="truncate text-left">
                                                <h3 class="font-semibold text-sm truncate">
                                                    {blocked.username}
                                                </h3>
                                                <span class="text-xs text-base-content/50 block truncate">
                                                    ID: {blocked.oppositeId}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            class="btn btn-outline btn-xs"
                                            hx-confirm={`Buka blokir ${blocked.username}?`}
                                            hx-delete={`/contact/block/${blocked.oppositeId}`}
                                        >
                                            Buka Blokir
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Main Panel */}
                    <div class="flex-1 hidden md:flex flex-col h-full bg-base-100 overflow-hidden w-full">
                        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-base-200/20">
                            <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
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
                                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6 0 3.375 3.375 0 016 0zm6 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                                    />
                                </svg>
                            </div>
                            <h2 class="text-xl font-bold mb-2">Manajemen Kontak & Permintaan</h2>
                            <p class="text-base-content/60 max-w-sm mb-6 text-sm">
                                Kirim permintaan pertemanan dengan ID unik bertipe angka atau kelola
                                daftar teman Anda.
                            </p>
                            <button onclick="add_contact_modal.showModal()" class="btn btn-primary">
                                Kirim Permintaan Pertemanan
                            </button>
                        </div>
                    </div>
                </div>

                <MobileNavigation />
            </div>

            {/* Modal - Cari Teman (Username / ID 6 Digit) & Link Undangan */}
            <dialog id="add_contact_modal" class="modal">
                <div class="modal-box space-y-4">
                    <h3 class="font-bold text-lg">Tambah Teman</h3>

                    <div id="modal-alert-message"></div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-semibold">
                                Cari Username atau ID 6 Digit
                            </span>
                        </label>
                        <input
                            type="text"
                            name="q"
                            placeholder="Ketik minimal 3 huruf username atau ID 6 digit..."
                            class="input input-bordered w-full input-sm"
                            hx-get="/contact/search"
                            hx-trigger="input changed delay:400ms, search"
                            hx-target="#search-user-results"
                        />
                    </div>

                    <div id="search-user-results" class="max-h-56 overflow-y-auto space-y-2">
                        <p class="text-xs text-base-content/50">
                            Ketik minimal 3 karakter username atau ID 6 digit.
                        </p>
                    </div>

                    <div class="divider text-xs text-base-content/50 my-2">atau</div>

                    <div
                        class="flex items-center justify-between gap-2 bg-base-200 p-3 rounded-xl"
                        x-data={`{ invitePath: '/contact/invite/${user.id}', copied: false }`}
                    >
                        <div class="truncate text-xs">
                            <p class="font-semibold">Link Undangan Anda</p>
                            <p class="text-base-content/60 truncate" x-text="window.location.origin + invitePath"></p>
                        </div>
                        <button
                            type="button"
                            class="btn btn-outline btn-xs shrink-0"
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
                            class="btn btn-ghost btn-sm"
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
                <div class="text-center p-6 text-base-content/50 text-sm">
                    Tidak ada permintaan pertemanan masuk.
                </div>
            ) : (
                contacts.map((contact) => (
                    <div
                        x-show={`!search || '${contact.username}'.toLowerCase().includes(search.toLowerCase()) || '${contact.oppositeId}'.includes(search)`}
                        class="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 transition w-full"
                    >
                        <div class="flex items-center gap-3 truncate">
                            <div class="avatar placeholder shrink-0">
                                <div class="bg-accent text-accent-content rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                                    {contact.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div class="truncate text-left">
                                <h3 class="font-semibold text-sm truncate">{contact.username}</h3>
                                <span class="text-xs text-base-content/50 block truncate">
                                    ID: {contact.oppositeId}
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1">
                            {/* Confirm Button */}
                            <button
                                class="btn btn-success btn-xs text-white"
                                title="Terima Permintaan"
                                hx-confirm={`Terima permintaan pertemanan dari ${contact.username}?`}
                                hx-patch="/contact"
                                hx-vals={`{"id": "${contact.oppositeId}", "status": "accepted"}`}
                            >
                                Konfirmasi
                            </button>
                            {/* Reject Button */}

                            <button
                                class="btn btn-ghost btn-xs text-error"
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
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-base-200/70">
                    <div class="flex items-center gap-2.5 truncate">
                        <div class="avatar placeholder shrink-0">
                            <div class="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs">
                                {item.username.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="truncate">
                            <p class="font-semibold text-sm truncate">{item.username}</p>
                            <span class="text-[11px] text-base-content/50">ID: {item.id}</span>
                        </div>
                    </div>

                    {item.relationStatus === 'none' && (
                        <button
                            type="button"
                            class="btn btn-primary btn-xs"
                            hx-post="/contact"
                            hx-target="#modal-alert-message"
                            hx-vals={`{"id": "${item.id}"}`}
                        >
                            Tambah Teman
                        </button>
                    )}
                    {item.relationStatus === 'pending_outgoing' && (
                        <span class="badge badge-ghost badge-sm">Menunggu</span>
                    )}
                    {item.relationStatus === 'pending_incoming' && (
                        <button
                            type="button"
                            class="btn btn-success btn-xs text-white"
                            hx-patch="/contact"
                            hx-vals={`{"id": "${item.id}", "status": "accepted"}`}
                        >
                            Terima
                        </button>
                    )}
                    {item.relationStatus === 'accepted' && (
                        <span class="badge badge-success badge-sm text-white">Berteman</span>
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
        <Layout title="Undangan Pertemanan" script={{ htmx: true, alpine: true }}>
            <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div class="card bg-base-100 border border-base-300 shadow-xl w-full max-w-md">
                    <div class="card-body items-center text-center gap-4">
                        {isSelf ? (
                            <>
                                <h2 class="card-title">Link Undangan Anda</h2>
                                <p class="text-sm text-base-content/70">
                                    Bagikan link ini kepada teman agar mereka dapat menambahkan{' '}
                                    <strong>{user.username}</strong> (ID: {user.id}).
                                </p>
                                <a href="/contact" class="btn btn-primary btn-sm">
                                    Kembali ke Kontak
                                </a>
                            </>
                        ) : !target ? (
                            <>
                                <h2 class="card-title text-error">Undangan Tidak Ditemukan</h2>
                                <p class="text-sm text-base-content/70">
                                    Pengguna tidak ditemukan atau undangan tidak tersedia.
                                </p>
                                <a href="/contact" class="btn btn-ghost btn-sm">
                                    Kembali ke Kontak
                                </a>
                            </>
                        ) : (
                            <>
                                <div class="avatar placeholder">
                                    <div class="bg-primary text-primary-content rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl">
                                        {target.username.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold">{target.username}</h2>
                                    <p class="text-xs text-base-content/60">ID: {target.id}</p>
                                </div>

                                <div id="invite-alert" class="w-full"></div>

                                {target.relationStatus === 'none' && (
                                    <button
                                        type="button"
                                        class="btn btn-primary w-full"
                                        hx-post="/contact"
                                        hx-target="#invite-alert"
                                        hx-vals={`{"id": "${target.id}"}`}
                                    >
                                        Kirim Permintaan Pertemanan
                                    </button>
                                )}
                                {target.relationStatus === 'pending_outgoing' && (
                                    <span class="badge badge-ghost">
                                        Permintaan pertemanan sudah dikirim
                                    </span>
                                )}
                                {target.relationStatus === 'pending_incoming' && (
                                    <button
                                        type="button"
                                        class="btn btn-success text-white w-full"
                                        hx-patch="/contact"
                                        hx-vals={`{"id": "${target.id}", "status": "accepted"}`}
                                    >
                                        Terima Permintaan Pertemanan
                                    </button>
                                )}
                                {target.relationStatus === 'accepted' && (
                                    <form method="POST" action="/direct" class="w-full">
                                        <input
                                            type="hidden"
                                            name="targetUserId"
                                            value={target.id}
                                        />
                                        <button type="submit" class="btn btn-primary w-full">
                                            Mulai Obrolan
                                        </button>
                                    </form>
                                )}

                                <a href="/contact" class="btn btn-ghost btn-sm">
                                    Kembali ke Kontak
                                </a>
                            </>
                        )}
                    </div>
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
    members: { userId: string; username: string; role: string }[];
    currentUserId: string;
    currentUserRole: string;
    addableContacts: { id: string; username: string }[];
}) {
    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

    return (
        <div class="space-y-4">
            <h3 class="font-bold text-lg">Anggota Grup: {roomName}</h3>

            <div id="group-member-alert"></div>

            {canManage && addableContacts.length > 0 && (
                <form
                    hx-post={`/group/${roomId}/members`}
                    hx-target="#group-member-alert"
                    class="flex gap-2"
                >
                    <select name="userId" class="select select-bordered select-sm flex-1" required>
                        <option value="" disabled selected>
                            Pilih kontak untuk ditambahkan...
                        </option>
                        {addableContacts.map((c) => (
                            <option value={c.id}>{c.username}</option>
                        ))}
                    </select>
                    <button type="submit" class="btn btn-primary btn-sm">
                        Tambah
                    </button>
                </form>
            )}

            <div class="max-h-60 overflow-y-auto space-y-2">
                {members.map((m) => (
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-base-200">
                        <div class="flex items-center gap-2.5">
                            <div class="avatar placeholder">
                                <div class="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs">
                                    {m.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <p class="text-sm font-semibold">{m.username}</p>
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
                                class="btn btn-ghost btn-xs text-error"
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
                                    class="btn btn-ghost btn-xs text-error"
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

            <div class="modal-action">
                <button
                    type="button"
                    onclick="group_members_modal.close()"
                    class="btn btn-ghost btn-sm"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
}
