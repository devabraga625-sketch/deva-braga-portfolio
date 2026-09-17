CREATE TABLE `notification_provider_settings` (
	`id` int NOT NULL,
	`smtpHost` varchar(255),
	`smtpPort` int,
	`smtpUser` varchar(320),
	`smtpPasswordEncrypted` text,
	`smtpFrom` varchar(320),
	`notificationEmail` varchar(320),
	`metaAccessTokenEncrypted` text,
	`metaPhoneNumberId` varchar(64),
	`metaBusinessAccountId` varchar(64),
	`metaTo` varchar(32),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_provider_settings_id` PRIMARY KEY(`id`)
);
