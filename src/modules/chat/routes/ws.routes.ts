import { Elysia } from 'elysia';
import { logger } from '../../../shared/logger';
import { wsIncomingMessageSchema } from '../model';
import { messageService } from '../services/message.service';
import { roomService } from '../services/room.service';
import { ChatPartial, PresencePartial, TypingPartial } from '../views';
import { onlineUsers, states } from '../presence';
import { chatSessionPlugin } from '../session';

export const wsRoutes = new Elysia()
    .use(chatSessionPlugin)
    .ws('/ws', {
        async open(ws) {
            const user = ws.data.user;
            if (!user) {
                ws.close();
                return;
            }

            const userRooms = await roomService.getUserRooms(user.id);
            const subscribedRooms = new Set<string>();
            for (const room of userRooms) {
                ws.subscribe(room.id);
                subscribedRooms.add(room.id);
            }

            states.set(ws.id, {
                ws,
                user,
                subscribedRooms,
            });

            const sockets = onlineUsers.get(user.id) ?? new Set<string>();
            const wasOffline = sockets.size === 0;
            sockets.add(ws.id);
            onlineUsers.set(user.id, sockets);

            if (wasOffline) {
                const html = PresencePartial(user.id, true);
                for (const roomId of subscribedRooms) {
                    ws.publish(roomId, html);
                }
            }
        },
        async message(ws, data) {
            const clientState = states.get(ws.id);
            if (!clientState) return;

            const parsed = wsIncomingMessageSchema.safeParse(data);
            if (!parsed.success) {
                logger.warn('Payload WebSocket tidak valid', {
                    module: 'chat',
                    userId: clientState.user.id,
                });
                return;
            }

            const payload = parsed.data;
            switch (payload.type) {
                case 'chatting': {
                    const { roomId, message } = payload;
                    const user = clientState.user;

                    const canSend = await messageService.canSendMessageInRoom(user.id, roomId);
                    if (!canSend) {
                        logger.warn('Pesan ditolak: bukan anggota atau pengguna diblokir', {
                            module: 'chat',
                            userId: user.id,
                            roomId,
                        });
                        return;
                    }

                    if (!clientState.subscribedRooms.has(roomId)) {
                        ws.subscribe(roomId);
                        clientState.subscribedRooms.add(roomId);
                    }

                    const created = await messageService.createMessage({
                        roomId,
                        userId: user.id,
                        content: message,
                    });

                    const response = ChatPartial({
                        isSelf: false,
                        username: user.username,
                        content: message,
                        roomId,
                        createdAt: created.createdAt,
                        type: 'text',
                    });
                    ws.publish(roomId, response);

                    const selfResponse = ChatPartial({
                        isSelf: true,
                        username: user.username,
                        content: message,
                        roomId,
                        createdAt: created.createdAt,
                        type: 'text',
                    });
                    ws.send(selfResponse);
                    break;
                }
                case 'typing': {
                    const { roomId, isTyping } = payload;
                    const user = clientState.user;

                    const canSend = await messageService.canSendMessageInRoom(user.id, roomId);
                    if (!canSend) return;

                    ws.publish(roomId, TypingPartial(roomId, user.username, isTyping));
                    break;
                }
            }
        },
        close(ws) {
            const clientState = states.get(ws.id);
            if (clientState) {
                const { user, subscribedRooms } = clientState;
                for (const roomId of subscribedRooms) {
                    ws.unsubscribe(roomId);
                }
                states.delete(ws.id);

                const sockets = onlineUsers.get(user.id);
                if (sockets) {
                    sockets.delete(ws.id);
                    if (sockets.size === 0) {
                        onlineUsers.delete(user.id);
                        const html = PresencePartial(user.id, false);
                        for (const roomId of subscribedRooms) {
                            ws.publish(roomId, html);
                        }
                    }
                }
            }
        },
    });
