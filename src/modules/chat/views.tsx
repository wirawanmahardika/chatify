import { Html } from '@elysiajs/html';
import type { MessageWithUser, RoomWithDetails } from './model';
import { Layout, Scripts } from '../../shared/views/layout';
import { User } from '../auth/model';

interface ChatPageProps {
    user: User;
    userRooms: RoomWithDetails[];
    availableUsers: { id: string; username: string }[];
}

export const ChatPage = ({ userRooms, user, availableUsers }: ChatPageProps) => {
    const scripts: Scripts = {
        alpine: true,
        htmx: true,
        htmxWebSocket: true,
        customScript: [{ src: '/public/js/chat-page.js', defer: true }],
    };

    return (
        <Layout title="Obrolan" script={scripts}>
            <div
                x-data={'{ currentPath:  window.location.pathname, activeRoomId: null  }'}
                class="bg-base-200 min-h-screen flex items-center justify-center font-sans text-base-content"
            >
                <div
                    hx-ext="ws"
                    ws-connect="/ws"
                    class="w-full h-screen bg-base-100 md:rounded-2xl md:shadow-2xl flex flex-col md:flex-row border border-base-300 overflow-hidden"
                >
                    <nav class="hidden md:flex flex-col items-center py-4 px-2 bg-base-200 border-r border-base-300 gap-4 shrink-0">
                        <div class="flex-1 flex flex-col gap-2">
                            {/* Chat / Messages Link */}
                            <a
                                href="/"
                                title="Obrolan"
                                class="p-2.5 rounded-xl"
                                x-bind:class={
                                    "currentPath === '/' ? 'bg-primary text-primary-content transition shadow-sm' : 'text-base-content/70 hover:bg-base-300 hover:text-base-content transition'"
                                }
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke-width="1.5"
                                    stroke="currentColor"
                                    class="size-6"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                                    />
                                </svg>
                            </a>

                            {/* Contacts Link */}
                            <a
                                href="/contact"
                                title="Kontak"
                                class="p-2.5 rounded-xl"
                                x-bind:class={
                                    "currentPath.startsWith('/contact') ? 'bg-primary text-primary-content transition shadow-sm' : 'text-base-content/70 hover:bg-base-300 hover:text-base-content transition'"
                                }
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
                                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                                    />
                                </svg>
                            </a>
                        </div>

                        {/* Settings Link */}
                        <a
                            href="/profile"
                            title="Pengaturan"
                            class="p-2.5 rounded-xl mt-auto"
                            x-bind:class={
                                "currentPath.startsWith('/profile') ? 'bg-primary text-primary-content transition shadow-sm' : 'text-base-content/70 hover:bg-base-300 hover:text-base-content transition'"
                            }
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="size-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                />
                            </svg>
                        </a>
                    </nav>

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

                <Dock />
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

function Dock() {
    return (
        <div class="dock md:hidden">
            <button x-bind:class={"currentPath === '/' && 'dock-active'"}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                    />
                </svg>
                <span class="dock-label">Chat</span>
            </button>

            <button x-bind:class={"currentPath.startsWith('/contact') && 'dock-active'"}>
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
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                </svg>
                <span class="dock-label">Kontak</span>
            </button>

            <button x-bind:class={"currentPath.startsWith('/profile') && 'dock-active'"}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
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
