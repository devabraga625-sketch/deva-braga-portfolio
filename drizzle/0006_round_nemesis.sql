CREATE TABLE `backup_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`lastRunAt` timestamp,
	`lastStatus` varchar(32),
	`lastError` text,
	`lastObjectKey` varchar(500),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backup_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `backup_jobs_name_unique` UNIQUE(`name`)
);
