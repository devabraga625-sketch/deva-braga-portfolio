CREATE TABLE `portfolio_project_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectKey` varchar(191) NOT NULL,
	`title` text,
	`description` text,
	`year` varchar(32),
	`thumbnail` text,
	`sourceUrl` text,
	`hidden` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_project_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_project_overrides_projectKey_unique` UNIQUE(`projectKey`)
);
