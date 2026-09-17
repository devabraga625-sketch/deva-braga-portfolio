CREATE TABLE `media_downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectKey` varchar(191) NOT NULL,
	`mediaIndex` int NOT NULL,
	`downloads` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_downloads_id` PRIMARY KEY(`id`)
);
