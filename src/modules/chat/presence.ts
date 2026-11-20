import type { User } from '../auth/model';
import type { MessageType } from './model';
import { ChatPartial } from './views';

export interface WSClientState {
    ws: { send: (data: string) => unknown };
    user: User;
    subscribedRooms: Set<string>;
}

export const states = new Map<string, WSClientState>();
export const onlineUsers = new Map<string, Set<string>>();

export function getOnlineUserIds(): Set<string> {
    return new Set(onlineUsers.keys());
}

export async function broadcastMessageToRoom(params: {
    roomId: string;
    senderId: string;
    senderUsername: string;
    content: string;
    type: MessageType;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    createdAt: Date;
}) {
    for (const client of states.values()) {
        if (!client.subscribedRooms.has(params.roomId)) continue;
        const isSelf = client.user.id === params.senderId;
        const html = await ChatPartial({
            isSelf,
            username: params.senderUsername,
            content: params.content,
            roomId: params.roomId,
            createdAt: params.createdAt,
            type: params.type,
            attachmentUrl: params.attachmentUrl,
            attachmentName: params.attachmentName,
        });
        client.ws.send(html);
    }
}
