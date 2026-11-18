import { Elysia, t } from 'elysia';
import { authService } from '../auth/service';
import { chatService } from './service';
import { ChatPage, ChatPanel, ChatPartial, Chats, ContactList, ContactsPage } from './views';
import type { User } from '../auth/model';
import { AddFriendshipBody, UpdateStatusFriendship } from './model';
import { ModalAlert } from '../../shared/views/components';

interface WSClientState {
    user: User;
    subscribedRooms: Set<string>;
}

const states = new Map<string, WSClientState>();

export const chatModule = new Elysia()
    .resolve(async ({ cookie: { session } }) => {
        if (!session.value) {
            session.remove();
            return { user: null };
        }
        const user = await authService.validateSession(session.value as string);
        if (!user) {
            session.remove();
            return { user: null };
        }
        return { user };
    })
    .get('/', async ({ redirect, user }) => {
        try {
            if (!user) return redirect('/auth/login');
            const userRooms = await chatService.getUserRooms(user.id);
            const availableUsers = await chatService.getContacts(user.id);
            return ChatPage({
                user: user,
                userRooms,
                availableUsers,
            });
        } catch (error) {
            return new Response(null, { status: 500 });
        }
    })
    .post(
        '/direct',
        async ({ body, redirect, user }) => {
            if (!user) return redirect('/auth/login');

            const { targetUserId } = body;
            if (!targetUserId || targetUserId === user.id) {
                return redirect('/');
            }
            await chatService.getOrCreateDirectRoom(user.id, targetUserId);
            return redirect('/');
        },
        {
            body: t.Object({
                targetUserId: t.String(),
            }),
        }
    )
    .get('/room/:roomId', async ({ params: { roomId }, set, user }) => {
        try {
            if (!user) {
                set.headers['HX-Redirect'] = '/auth/login';
                return;
            }

            const isMember = await chatService.isUserInRoom(user.id, roomId);
            if (!isMember) {
                set.headers['HX-Redirect'] = '/';
                return;
            }

            const initialMessages = await chatService.getRoomHistory(roomId, 10);
            const roomAndOpponent = await chatService.getRoomAndOpponent(roomId, user.id);

            return ChatPanel({
                messages: initialMessages,
                username: user.username,
                room: {
                    id: roomAndOpponent?.id || '',
                    name: roomAndOpponent?.name || '',
                    opponentName: roomAndOpponent?.opponentName || '',
                },
            });
        } catch (error) {
            return new Response(null, { status: 500 });
        }
    })
    .get(
        '/messages/:roomId',
        async ({ params: { roomId }, query: { beforeDate }, set, user }) => {
            try {
                if (!user) {
                    set.headers['HX-Redirect'] = '/auth/login';
                    return;
                }

                if (!beforeDate) {
                    set.headers['HX-Retarget'] = '#message-loader-btn';
                    set.headers['HX-Reswap'] = 'innerHTML';
                    return 'Tidak ada lagi pesan';
                }

                const msgs = await chatService.getPreviousMessages(roomId, beforeDate, 10);
                if (msgs.length <= 0) {
                    set.headers['HX-Retarget'] = '#message-loader-btn';
                    set.headers['HX-Reswap'] = 'innerHTML';
                    return 'Tidak ada lagi pesan';
                }
                return Chats(user.id, msgs);
            } catch (error) {
                return new Response(null, { status: 500 });
            }
        },
        {
            params: t.Object({ roomId: t.String() }),
            query: t.Optional(t.Object({ beforeDate: t.Date() })),
        }
    )
    .get('/contact', async ({ user, redirect }) => {
        try {
            if (!user) return redirect('/auth/login');
            const friendships = await chatService.getFriendship(user.id);
            return ContactsPage({
                contacts: friendships.filter((f) => f.status === 'accepted'),
                user: user,
                friendRequests: friendships.filter((f) => f.status === 'pending'),
            });
        } catch (error) {
            return new Response(null, { status: 500 });
        }
    })
    .get('/contacts', async ({ user, set }) => {
        if (!user) return new Response(null, { status: 403 });
        const friendships = await chatService.getFriendship(user.id);
        // set.headers['HX-Refresh'] = 'true';
        return ContactList({ contacts: friendships.filter((c) => c.status === 'accepted') });
    })
    .post(
        '/contact',
        async ({ body, user, redirect }) => {
            try {
                if (!user) return redirect('/auth/login');
                await chatService.addFriendship(user.id, body.id);
                return ModalAlert({
                    status: 'success',
                    msg: 'Berhasil mengirim permintaan pertemanan, mohon tunggu konfirmasi penerima',
                });
            } catch (error: any) {
                if (error instanceof Error)
                    return ModalAlert({ status: 'error', msg: error.message });
                return ModalAlert({ status: 'error', msg: 'Terjadi kesalahan' });
            }
        },
        { body: AddFriendshipBody }
    )
    .patch(
        '/contact',
        async ({ body, user, set, redirect }) => {
            if (!user) return redirect('/auth/login');
            await chatService.updateStatusFriendship(user.id, body.id, body.status);

            set.headers['HX-Refresh'] = 'true';
            return new Response(null, { status: 200 });
        },
        { body: UpdateStatusFriendship }
    )

    .ws('/ws', {
        async open(ws) {
            const user = ws.data.user;
            if (!user) return;

            // Auto-subscribe to all rooms the user is a member of so they can receive updates
            const userRooms = await chatService.getUserRooms(user.id);
            const subscribedRooms = new Set<string>();
            for (const room of userRooms) {
                ws.subscribe(room.id);
                subscribedRooms.add(room.id);
            }

            states.set(ws.id, {
                user,
                subscribedRooms,
            });
        },
        async message(ws, data: any) {
            const clientState = states.get(ws.id);
            if (!clientState) return;

            switch (data.type) {
                case 'chatting':
                    const roomId = data?.roomId;
                    const message = data?.message;
                    const user = clientState.user;

                    if (!roomId || !message) return;
                    const isMember = await chatService.isUserInRoom(user.id, roomId);
                    if (!isMember) return;
                    if (!clientState.subscribedRooms.has(roomId)) {
                        ws.subscribe(roomId);
                        clientState.subscribedRooms.add(roomId);
                    }

                    const { createdAt } = await chatService.createMessage({
                        roomId,
                        userId: user.id,
                        content: message,
                    });

                    const response = ChatPartial(false, user.username, message, roomId, createdAt);
                    ws.publish(roomId, response);
                    const selfResponse = ChatPartial(
                        true,
                        user.username,
                        message,
                        roomId,
                        createdAt
                    );
                    ws.send(selfResponse);
                    break;
            }
        },
        close(ws) {
            const clientState = states.get(ws.id);
            if (clientState) {
                for (const roomId of clientState.subscribedRooms) {
                    ws.unsubscribe(roomId);
                }
                states.delete(ws.id);
            }
        },
    });

export default chatModule;
