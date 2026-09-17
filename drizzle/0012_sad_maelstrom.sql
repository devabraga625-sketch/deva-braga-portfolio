CREATE TABLE `media_download_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectKey` varchar(191) NOT NULL,
	`mediaIndex` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_download_events_id` PRIMARY KEY(`id`)
);
