import { Html } from '@elysiajs/html';
import type { MessageWithUser, RequestFriendship, RoomWithDetails } from './model';
import { Layout, Scripts } from '../../shared/views/layout';
import { User } from '../auth/model';
import { DesktopNavigation, MobileNavigation } from '../../shared/views/components';

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
                    hx-ext="ws"
                    ws-connect="/ws"
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

                        {/* Direct Messages Section Title & New Chat Button */}
                        <div class="p-3 border-b border-base-300 flex justify-between items-center bg-base-100">
                            <span class="text-xs font-bold uppercase tracking-wider text-base-content/60">
                                Direct Messages
                            </span>
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
                                        room.opponentName || room.name || 'Direct Message';
                                    const initial = title.charAt(0).toUpperCase();
                                    const lastMsg = room.lastMessage
                                        ? room.lastMessage.content
                                        : 'Belum ada pesan';

                                    return (
                                        <button
                                            hx-get={`/room/${room.id}`}
                                            hx-target="#chat-panel"
                                            hx-swap="outerHTML"
                                            hx-on-htmx-after-request="scrollToBottom()"
                                            x-on:click={`activeRoomId = '${room.id}'`}
                                            x-bind:class={`activeRoomId === '${room.id}' ? 'bg-primary text-primary-content shadow-md' : 'hover:bg-base-200 text-base-content'`}
                                            class="flex items-center gap-3 p-3 rounded-xl transition w-full"
                                        >
                                            <div class="avatar placeholder shrink-0">
                                                <div
                                                    x-bind:class={`activeRoomId === '${room.id}' ? 'bg-primary-content text-primary' : 'bg-neutral text-neutral-content'`}
                                                    class={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm`}
                                                >
                                                    {initial}
                                                </div>
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="flex justify-between items-baseline flex-col ">
                                                    <h3 class="font-semibold text-sm truncate">
                                                        {title}
                                                    </h3>
                                                    <p
                                                        id={room.id}
                                                        x-bind:class={`activeRoomId === '${room.id}' ? 'text-primary-content/80' : 'text-base-content/60'`}
                                                        class="text-xs truncate mt-0.5 text-left"
                                                    >
                                                        {room.lastMessage?.sender ===
                                                        room.opponentId
                                                            ? room.opponentName + ': '
                                                            : room.lastMessage?.content && 'You: '}
                                                        {lastMsg}
                                                    </p>
                                                </div>
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
        </Layout>
    );
};

export const ChatPartial = (
    isSelf: boolean = false,
    username: string,
    content: string,
    roomId: string,
    createdAt: Date
) => {
    return (
        <>
            <div id={'chat-' + roomId} hx-swap-oob="beforeend">
                <div class={`chat ${isSelf ? 'chat-end' : 'chat-start'}`}>
                    <div class="chat-header text-xs opacity-70 mb-1">{username}</div>
                    <div
                        class={`chat-bubble max-w-[80%] ${isSelf ? 'chat-bubble-primary' : 'chat-bubble-neutral'} `}
                    >
                        {content}
                    </div>
                    <div
                        x-data={`{ time: '${createdAt.toISOString()}'} `}
                        x-text="formatChatTime(time)"
                        class="chat-footer opacity-70 text-xs"
                    ></div>
                </div>
            </div>
            <p id={roomId} hx-swap-oob="innerHTML">
                {isSelf ? 'You' : username}: {content}
            </p>
        </>
    );
};

export const Chats = (
    userId: string,
    messages: { senderId: string; sender: string; content: string; createdAt: Date }[]
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
                            {m.content}
                        </div>
                        <div
                            x-data={`{ time: '${m.createdAt.toISOString()}'} `}
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
        opponentName: string;
    };
}) => {
    return (
        <div
            id={'chat-panel'}
            x-ref="chatPanel"
            class="flex-1 flex flex-col h-full bg-base-100 overflow-hidden w-full empty:hidden fixed md:static"
        >
            {/* Chat Header */}
            <header class="p-4 bg-base-100 border-b border-base-300 flex justify-between items-center z-10 shadow-sm">
                <div class="flex items-center gap-3">
                    {/* Back Button for Mobile */}
                    <button
                        x-on:click="$refs.chatPanel.innerHTML = ''"
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
                            {(room.opponentName || room.name || 'D').charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div>
                        <h1 class="font-bold text-base leading-tight">
                            {room.opponentName || room.name || 'Direct Message'}
                        </h1>
                        <span class="text-xs text-success flex items-center gap-1 mt-0.5">
                            <span class="w-2 h-2 rounded-full bg-success inline-block"></span>{' '}
                            Direct Chat
                        </span>
                    </div>
                </div>
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
                        hx-on-htmx-config-request="
                            const beforeDate = htmx.find('#message-loader').nextElementSibling.dataset.createdAt
                            event.detail.parameters['beforeDate'] = beforeDate
                        "
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
                                    {m.content}
                                </div>
                                <div
                                    x-data={`{ time: '${m.createdAt.toISOString()}'} `}
                                    x-text="formatChatTime(time)"
                                    class="chat-footer opacity-70 text-xs"
                                ></div>
                            </div>
                        );
                    })}
            </div>
            {/* Footer / Input Form */}
            <form
                id="form"
                class="p-4 bg-base-100 border-t border-base-300 flex gap-2 items-center"
                ws-send
            >
                <input type="hidden" name="type" value="chatting" />
                <input type="hidden" name="roomId" value={room.id} />
                <input
                    id="input-message"
                    type="text"
                    name="message"
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
    );
};

export const ContactsPage = ({
    contacts,
    user,
    friendRequests = [],
}: {
    user: User;
    contacts: RequestFriendship[];
    friendRequests?: RequestFriendship[];
}) => {
    const scripts: Scripts = {
        alpine: true,
        htmx: true,
        customScript: [{ src: '/public/js/chat-page.js', defer: true }],
    };

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

                        {/* Navigation Tabs (Kontak vs Permintaan) */}
                        <div class="p-2 border-b border-base-300 grid grid-cols-2 gap-1 bg-base-100">
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
                                {friendRequests.length > 0 && (
                                    <span class="badge badge-error badge-xs">
                                        {friendRequests.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Direct Actions & Title */}
                        <div class="p-3 border-b border-base-300 flex justify-between items-center bg-base-100">
                            <span
                                x-text="activeTab === 'contacts' ? 'Daftar Kontak' : 'Permintaan Pertemanan'"
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
                                Kirim Permintaan
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
                                            <form
                                                method="POST"
                                                action={`/contacts/delete/${contact.oppositeId}`}
                                            >
                                                <button
                                                    type="submit"
                                                    class="btn btn-ghost btn-circle btn-xs text-error"
                                                    title="Hapus Kontak"
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
                                                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                                        />
                                                    </svg>
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* TAB 2: Friend Requests List */}
                        <div
                            id="friend-requests"
                            x-show="activeTab === 'requests'"
                            class="flex-1 overflow-y-auto p-2 space-y-1"
                        >
                            {friendRequests.length === 0 ? (
                                <div class="text-center p-6 text-base-content/50 text-sm">
                                    Tidak ada permintaan pertemanan masuk.
                                </div>
                            ) : (
                                friendRequests.map((req) => (
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
                                            {/* Confirm Button */}
                                            <button
                                                class="btn btn-success btn-xs text-white"
                                                title="Terima Permintaan"
                                                hx-confirm={`Terima permintaan pertemanan dari ${req.username}?`}
                                                hx-patch="/contact"
                                                hx-target="closest [x-show]"
                                                hx-swap="outerHTML"
                                                hx-vals={`{"id": "${req.oppositeId}", "status": "accepted"}`}
                                            >
                                                Konfirmasi
                                            </button>
                                            {/* Reject Button */}

                                            <button
                                                class="btn btn-ghost btn-xs text-error"
                                                title="Tolak Permintaan"
                                                hx-confirm={`Tolak permintaan pertemanan dari ${req.username}?`}
                                                hx-patch="/contact"
                                                hx-target="closest [x-show]"
                                                hx-swap="outerHTML"
                                                hx-vals={`{"id": "${req.oppositeId}", "status": "rejected"}`}
                                            >
                                                Tolak
                                            </button>
                                        </div>
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

            {/* Modal - Send Friend Request via Numeric ID */}
            <dialog id="add_contact_modal" class="modal">
                <div class="modal-box">
                    <h3 class="font-bold text-lg mb-4">Kirim Permintaan Pertemanan</h3>

                    <div id="modal-alert-message"></div>

                    <form hx-post="/contact" hx-target="#modal-alert-message" class="space-y-4">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-semibold">
                                    ID Pengguna Target (Angka)
                                </span>
                            </label>
                            <input
                                type="text"
                                name="id"
                                pattern="[0-9]*"
                                inputmode="numeric"
                                placeholder="Masukkan ID Angka (contoh: 12345)"
                                class="input input-bordered w-full"
                                required
                                oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                            />
                        </div>
                        <div class="modal-action">
                            <button
                                type="button"
                                onclick="add_contact_modal.close()"
                                class="btn btn-ghost btn-sm"
                            >
                                Batal
                            </button>
                            <button type="submit" class="btn btn-primary btn-sm">
                                Kirim Permintaan
                            </button>
                        </div>
                    </form>
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
