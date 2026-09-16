CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor` varchar(320) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityKey` varchar(191) NOT NULL,
	`action` varchar(64) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `portfolio_project_overrides` ADD `media` text;