CREATE TABLE `notification_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteRequestId` int,
	`channel` varchar(32) NOT NULL,
	`attemptType` varchar(32) NOT NULL,
	`status` varchar(32) NOT NULL,
	`errorCode` varchar(64),
	`providerMessageId` varchar(255),
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_attempts_id` PRIMARY KEY(`id`)
);
