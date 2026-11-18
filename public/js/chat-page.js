let activeWsConnection = null;
let typingTimeout = null;
let lastTypingRoomId = null;

document.body.addEventListener('htmx:ws:after:connection', (event) => {
    activeWsConnection = event.detail?.connection ?? null;
});

document.body.addEventListener('htmx:ws:after:message:outgoing', () => {
    const input = document.querySelector('#input-message');
    if (input) {
        sendTypingState(input.dataset.roomId, false);
        input.value = '';
    }
});

document.body.addEventListener('htmx:ws:after:message:incoming', () => {
    scrollToBottom();

    const wsMessages = document.querySelectorAll('[data-ws-msg="true"]');
    const latest = wsMessages[wsMessages.length - 1];
    if (!latest) return;

    latest.removeAttribute('data-ws-msg');
    const roomId = latest.dataset.roomId;
    const isSelf = latest.dataset.isSelf === 'true';
    const sender = latest.dataset.sender || 'Seseorang';
    const preview = latest.dataset.preview || '';

    if (isSelf || !roomId) return;

    if (window.__activeRoomId === roomId) {
        fetch(`/room/${roomId}/read`, { method: 'POST' }).catch(() => {});
        return;
    }

    incrementUnreadBadge(roomId);
    showMessageToast(sender, preview);
});

document.body.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== 'input-message') return;

    const roomId = target.dataset.roomId;
    if (!roomId) return;

    sendTypingState(roomId, true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        sendTypingState(roomId, false);
    }, 2000);
});

function sendTypingState(roomId, isTyping) {
    if (!roomId || !activeWsConnection) return;
    if (!isTyping && lastTypingRoomId !== roomId) return;

    lastTypingRoomId = isTyping ? roomId : null;
    try {
        activeWsConnection.send(JSON.stringify({ type: 'typing', roomId, isTyping }));
    } catch {
        // Ignore if socket is closing
    }
}

function clearUnreadBadge(roomId) {
    const badge = document.getElementById(`unread-badge-${roomId}`);
    if (!badge) return;
    badge.textContent = '0';
    badge.classList.add('hidden');
}

function incrementUnreadBadge(roomId) {
    const badge = document.getElementById(`unread-badge-${roomId}`);
    if (!badge) return;
    const next = (parseInt(badge.textContent || '0', 10) || 0) + 1;
    badge.textContent = String(next);
    badge.classList.remove('hidden');
}

function showMessageToast(sender, preview) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'alert alert-info shadow-lg text-sm max-w-xs';
    const textSpan = document.createElement('span');
    textSpan.textContent = `${sender}: ${preview}`;
    toast.appendChild(textSpan);

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function scrollToBottom() {
    const chatWindow = document.querySelector('[chat-window]');
    if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
}

function formatChatTime(dateInput) {
    const date = new Date(dateInput);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    if (isToday) {
        return timeStr;
    }

    if (isYesterday) {
        return `Kemarin ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
    });

    return `${dateStr} ${timeStr}`;
}
