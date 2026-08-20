CREATE TABLE `friendships` (
	`sender_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	PRIMARY KEY(`sender_id`, `receiver_id`),
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
