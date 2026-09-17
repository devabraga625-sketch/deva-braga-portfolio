ALTER TABLE `users` ADD `twoFactorSecret` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorEnabled` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorRequired` int DEFAULT 1 NOT NULL;