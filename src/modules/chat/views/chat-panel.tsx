import { Html } from '@elysiajs/html';
import type { MessageType, MessageWithUser, RoomType } from '../model';
import { UserAvatar } from '../../../shared/components/avatar';

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
