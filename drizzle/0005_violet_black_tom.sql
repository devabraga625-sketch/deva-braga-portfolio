CREATE TABLE `notification_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventKey` varchar(64) NOT NULL,
	`title` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`severity` enum('info','success','warning','urgent') NOT NULL DEFAULT 'info',
	`enabled` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_templates_eventKey_unique` UNIQUE(`eventKey`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventKey` varchar(64) NOT NULL,
	`title` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`severity` enum('info','success','warning','urgent') NOT NULL DEFAULT 'info',
	`recipient` varchar(64) NOT NULL DEFAULT 'owner',
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
