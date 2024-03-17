CREATE TABLE `event_log` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`event` text NOT NULL,
	`stream_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient` text NOT NULL,
	`sender` text NOT NULL,
	`event` text NOT NULL,
	`stream_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registry` (
	`registry_signature` text NOT NULL,
	`identity_signature` text NOT NULL,
	`handshake_key` text NOT NULL,
	`data` text NOT NULL,
	`data_signature` text NOT NULL,
	`dctrl` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `eventLog_idIdx` ON `event_log` (`id`);--> statement-breakpoint
CREATE INDEX `eventLog_ownerIdx` ON `event_log` (`owner`);--> statement-breakpoint
CREATE INDEX `eventLog_streamIdIdx` ON `event_log` (`stream_id`);--> statement-breakpoint
CREATE INDEX `eventLog_senderIdx` ON `event_log` (`sender`);--> statement-breakpoint
CREATE INDEX `eventLog_recipientIdx` ON `event_log` (`recipient`);--> statement-breakpoint
CREATE INDEX `eventQueue_idIdx` ON `event_queue` (`id`);--> statement-breakpoint
CREATE INDEX `eventQueue_recipientIdx` ON `event_queue` (`recipient`);--> statement-breakpoint
CREATE INDEX `eventQueue_senderIdx` ON `event_queue` (`sender`);--> statement-breakpoint
CREATE INDEX `registry_dctrl` ON `registry` (`dctrl`);