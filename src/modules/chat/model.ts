import { z } from 'zod';

export const roomTypeSchema = z.enum(['direct', 'group']);
export type RoomType = z.infer<typeof roomTypeSchema>;

export const roomSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    type: roomTypeSchema,
    createdBy: z.string().nullable().optional(),
    createdAt: z.date(),
});
export type Room = z.infer<typeof roomSchema>;

export const roomWithDetailsSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    type: roomTypeSchema,
    opponentId: z.string().nullable(),
    opponentName: z.string().nullable(),
    opponentAvatarUrl: z.string().nullable().optional(),
    isOpponentOnline: z.boolean(),
    memberCount: z.number(),
    unreadCount: z.number(),
    lastMessage: z
        .object({
            sender: z.string(),
            content: z.string(),
            createdAt: z.date(),
        })
        .nullable(),
});
export type RoomWithDetails = z.infer<typeof roomWithDetailsSchema>;

export const messageTypeSchema = z.enum(['text', 'image', 'file']);
export type MessageType = z.infer<typeof messageTypeSchema>;

export const messageSchema = z.object({
    id: z.number(),
    roomId: z.string(),
    userId: z.string(),
    type: messageTypeSchema,
    content: z.string(),
    attachmentUrl: z.string().nullable().optional(),
    attachmentName: z.string().nullable().optional(),
    createdAt: z.date(),
});
export type Message = z.infer<typeof messageSchema>;

export const messageWithUserSchema = messageSchema.extend({
    username: z.string(),
});
export type MessageWithUser = z.infer<typeof messageWithUserSchema>;

export const sendMessageSchema = z.object({
    roomId: z.string().min(1, 'ID ruang obrolan wajib diisi'),
    content: z
        .string()
        .trim()
        .min(1, 'Pesan tidak boleh kosong')
        .max(1000, 'Pesan maksimal 1000 karakter'),
});
export type SendMessage = z.infer<typeof sendMessageSchema>;

export const wsIncomingMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('chatting'),
        roomId: z.string().min(1, 'ID ruang obrolan wajib diisi'),
        message: z
            .string()
            .trim()
            .min(1, 'Pesan tidak boleh kosong')
            .max(1000, 'Pesan maksimal 1000 karakter'),
    }),
    z.object({
        type: z.literal('typing'),
        roomId: z.string().min(1, 'ID ruang obrolan wajib diisi'),
        isTyping: z.boolean(),
    }),
]);
export type WsIncomingMessage = z.infer<typeof wsIncomingMessageSchema>;

export const directRoomBodySchema = z.object({
    targetUserId: z.string().trim().min(1, 'ID pengguna tujuan wajib diisi'),
});
export type DirectRoomBody = z.infer<typeof directRoomBodySchema>;

export const createGroupBodySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Nama grup minimal 2 karakter')
        .max(50, 'Nama grup maksimal 50 karakter'),
    memberIds: z.union([z.array(z.string()), z.string()]).optional(),
});
export type CreateGroupBody = z.infer<typeof createGroupBodySchema>;

export const groupMemberBodySchema = z.object({
    userId: z.string().trim().min(1, 'ID pengguna wajib diisi'),
});

export const groupMemberParamsSchema = z.object({
    roomId: z.string().min(1, 'ID ruang obrolan wajib diisi'),
    userId: z.string().min(1, 'ID pengguna wajib diisi'),
});

export const roomParamsSchema = z.object({
    roomId: z.string().min(1, 'ID ruang obrolan wajib diisi'),
});

export const uploadFilenameParamsSchema = z.object({
    filename: z
        .string()
        .regex(/^[a-f0-9-]+\.[a-z0-9]+$/i, 'Nama file tidak valid'),
});

export const messagesQuerySchema = z.object({
    beforeDate: z.coerce.date().optional(),
});

export const friendshipStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'blocked']);
export type FriendshipStatus = z.infer<typeof friendshipStatusSchema>;

export const addFriendshipBodySchema = z.object({
    id: z.string().trim().min(1, 'ID pengguna wajib diisi'),
});
export type AddFriendshipBody = z.infer<typeof addFriendshipBodySchema>;

export const updateStatusFriendshipSchema = z.object({
    id: z.string().trim().min(1, 'ID pengguna wajib diisi'),
    status: z.enum(['accepted', 'rejected', 'blocked']),
});
export type UpdateStatusFriendship = z.infer<typeof updateStatusFriendshipSchema>;

export const blockUserBodySchema = z.object({
    id: z.string().trim().min(1, 'ID pengguna wajib diisi'),
});
export type BlockUserBody = z.infer<typeof blockUserBodySchema>;

export const userIdParamsSchema = z.object({
    id: z.string().trim().min(1, 'ID pengguna wajib diisi'),
});

export const searchUserQuerySchema = z.object({
    q: z.string().trim().max(50, 'Kata kunci pencarian terlalu panjang').default(''),
});

export const relationStatusSchema = z.enum([
    'none',
    'pending_incoming',
    'pending_outgoing',
    'accepted',
    'blocked',
]);
export type RelationStatus = z.infer<typeof relationStatusSchema>;

export const userSearchResultSchema = z.object({
    id: z.string(),
    username: z.string(),
    avatarUrl: z.string().nullable().optional(),
    relationStatus: relationStatusSchema,
});
export type UserSearchResult = z.infer<typeof userSearchResultSchema>;

export const requestFriendshipSchema = z.object({
    oppositeId: z.string(),
    status: friendshipStatusSchema,
    direction: z.enum(['incoming', 'outgoing']),
    username: z.string(),
    avatarUrl: z.string().nullable().optional(),
    createdAt: z.date(),
});
export type RequestFriendship = z.infer<typeof requestFriendshipSchema>;
