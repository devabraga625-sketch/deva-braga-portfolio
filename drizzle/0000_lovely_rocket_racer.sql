CREATE TABLE `behance_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectKey` varchar(191) NOT NULL,
	`title` text NOT NULL,
	`sourceUrl` text NOT NULL,
	`cover` text,
	`description` text,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `behance_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `behance_projects_projectKey_unique` UNIQUE(`projectKey`)
);
--> statement-breakpoint
CREATE TABLE `behance_sync_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`lastSyncedAt` timestamp,
	`lastStatus` varchar(32),
	`lastError` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `behance_sync_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `behance_sync_jobs_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
