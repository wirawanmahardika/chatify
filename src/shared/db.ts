import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
    pgTable,
    pgEnum,
    text,
    serial,
    timestamp,
    primaryKey,
    index,
} from 'drizzle-orm/pg-core';
import { config } from '../config';

const connectionUrl = config.NODE_ENV === 'test' ? config.TEST_DB_URL : config.DB_URL;

export const sql = postgres(connectionUrl, {
    max: config.NODE_ENV === 'test' ? 5 : 10,
});

export const roomTypeEnum = pgEnum('room_type', ['direct', 'group']);
export const roomRoleEnum = pgEnum('room_role', ['owner', 'admin', 'member']);
export const friendshipStatusEnum = pgEnum('friendship_status', [
    'pending',
    'accepted',
    'rejected',
    'blocked',
]);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'file']);

export const usersTable = pgTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessionsTable = pgTable(
    'sessions',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => usersTable.id, { onDelete: 'cascade' }),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    },
    (table) => [index('sessions_user_id_idx').on(table.userId)]
);

export const roomsTable = pgTable('rooms', {
    id: text('id').primaryKey(),
    name: text('name'),
    type: roomTypeEnum('type').default('direct').notNull(),
    createdBy: text('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const roomMembersTable = pgTable(
    'room_members',
    {
        roomId: text('room_id')
            .notNull()
            .references(() => roomsTable.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => usersTable.id, { onDelete: 'cascade' }),
        role: roomRoleEnum('role').default('member').notNull(),
        lastReadAt: timestamp('last_read_at', { withTimezone: true }).defaultNow().notNull(),
        joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.roomId, table.userId] }),
        index('room_members_user_id_idx').on(table.userId),
    ]
);

export const messagesTable = pgTable(
    'messages',
    {
        id: serial('id').primaryKey(),
        roomId: text('room_id')
            .notNull()
            .references(() => roomsTable.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => usersTable.id, { onDelete: 'cascade' }),
        type: messageTypeEnum('type').default('text').notNull(),
        content: text('content').notNull(),
        attachmentUrl: text('attachment_url'),
        attachmentName: text('attachment_name'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [index('messages_room_created_idx').on(table.roomId, table.createdAt)]
);

export const friendshipsTable = pgTable(
    'friendships',
    {
        senderId: text('sender_id')
            .notNull()
            .references(() => usersTable.id, { onDelete: 'cascade' }),
        receiverId: text('receiver_id')
            .notNull()
            .references(() => usersTable.id, { onDelete: 'cascade' }),
        status: friendshipStatusEnum('status').default('pending').notNull(),
        blockedBy: text('blocked_by').references(() => usersTable.id, { onDelete: 'set null' }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.senderId, table.receiverId] }),
        index('friendships_receiver_idx').on(table.receiverId),
    ]
);

export const db = drizzle(sql);
