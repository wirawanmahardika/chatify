import { and, desc, eq, lt, ne } from 'drizzle-orm';
import {
    db,
    messagesTable,
    roomMembersTable,
    roomsTable,
    usersTable,
} from '../../../shared/db';
import type { Message, MessageType, MessageWithUser } from '../model';
import { contactService } from './contact.service';
import { roomService } from './room.service';

export class MessageService {
    async canSendMessageInRoom(userId: string, roomId: string): Promise<boolean> {
        const isMember = await roomService.isUserInRoom(userId, roomId);
        if (!isMember) return false;

        const [room] = await db
            .select({ type: roomsTable.type })
            .from(roomsTable)
            .where(eq(roomsTable.id, roomId))
            .limit(1);

        if (!room) return false;
        if (room.type !== 'direct') return true;

        const [opponent] = await db
            .select({ userId: roomMembersTable.userId })
            .from(roomMembersTable)
            .where(and(eq(roomMembersTable.roomId, roomId), ne(roomMembersTable.userId, userId)))
            .limit(1);

        if (!opponent) return true;
        return !(await contactService.isBlockedBetween(userId, opponent.userId));
    }

    async canAccessUpload(userId: string, attachmentUrl: string): Promise<boolean> {
        const [msg] = await db
            .select({ roomId: messagesTable.roomId })
            .from(messagesTable)
            .where(eq(messagesTable.attachmentUrl, attachmentUrl))
            .limit(1);

        if (!msg) return false;
        return roomService.isUserInRoom(userId, msg.roomId);
    }

    async getRoomHistory(
        roomId: string,
        limit: number = 50,
        cursorId?: number
    ): Promise<MessageWithUser[]> {
        const condition =
            cursorId !== undefined
                ? and(eq(messagesTable.roomId, roomId), lt(messagesTable.id, cursorId))
                : eq(messagesTable.roomId, roomId);

        return db
            .select({
                id: messagesTable.id,
                roomId: messagesTable.roomId,
                userId: messagesTable.userId,
                type: messagesTable.type,
                content: messagesTable.content,
                attachmentUrl: messagesTable.attachmentUrl,
                attachmentName: messagesTable.attachmentName,
                createdAt: messagesTable.createdAt,
                username: usersTable.username,
            })
            .from(messagesTable)
            .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
            .where(condition)
            .orderBy(desc(messagesTable.id))
            .limit(limit);
    }

    async createMessage(data: {
        roomId: string;
        userId: string;
        content: string;
        type?: MessageType;
        attachmentUrl?: string | null;
        attachmentName?: string | null;
    }): Promise<Message> {
        const [created] = await db
            .insert(messagesTable)
            .values({
                roomId: data.roomId,
                userId: data.userId,
                type: data.type ?? 'text',
                content: data.content,
                attachmentUrl: data.attachmentUrl ?? null,
                attachmentName: data.attachmentName ?? null,
            })
            .returning({
                id: messagesTable.id,
                roomId: messagesTable.roomId,
                userId: messagesTable.userId,
                type: messagesTable.type,
                content: messagesTable.content,
                attachmentUrl: messagesTable.attachmentUrl,
                attachmentName: messagesTable.attachmentName,
                createdAt: messagesTable.createdAt,
            });

        return created;
    }

    async getPreviousMessages(roomId: string, beforeDate: Date, limit: number) {
        return db
            .select({
                senderId: messagesTable.userId,
                sender: usersTable.username,
                type: messagesTable.type,
                content: messagesTable.content,
                attachmentUrl: messagesTable.attachmentUrl,
                attachmentName: messagesTable.attachmentName,
                createdAt: messagesTable.createdAt,
            })
            .from(messagesTable)
            .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
            .where(and(eq(messagesTable.roomId, roomId), lt(messagesTable.createdAt, beforeDate)))
            .orderBy(desc(messagesTable.createdAt))
            .limit(limit);
    }
}

export const messageService = new MessageService();
