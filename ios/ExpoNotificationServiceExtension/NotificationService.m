//
//  NotificationService.m
//  ExpoNotificationServiceExtension
//
//  Created by Yifei He (hesyifei) on 06/28/2019.
//  Copyright © 2019 650 Industries. All rights reserved.
//

#import "NotificationService.h"

@interface NotificationService ()

@property (nonatomic, strong) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong) UNMutableNotificationContent *bestAttemptContent;

@end

@implementation NotificationService

- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
	self.contentHandler = contentHandler;
	self.bestAttemptContent = [request.content mutableCopy];


	NSString *attachmentMediaURLString = nil;

	NSDictionary *userInfo = request.content.userInfo;
	if (userInfo && userInfo[@"body"] && userInfo[@"body"][@"_richContent"]) {
		NSDictionary *richContent = userInfo[@"body"][@"_richContent"];
		// Display priority: video > audio > image.
		for (NSString* attachmentType in @[@"video", @"audio", @"image"]) {
			if (richContent[attachmentType]) {
				attachmentMediaURLString = richContent[attachmentType];
				break;
			}
		}
	}

	if (!attachmentMediaURLString) {
		self.contentHandler(self.bestAttemptContent);
		return;
	}

	[[NSURLSession.sharedSession downloadTaskWithURL:[NSURL URLWithString:attachmentMediaURLString] completionHandler:^(NSURL * _Nullable location, NSURLResponse * _Nullable response, NSError * _Nullable downloadError) {
		if (downloadError) {
			self.contentHandler(self.bestAttemptContent);
			return;
		}

		if (location && response) {
			// Use `suggestedFilename` to set appropriate file extension.
			NSString *temporaryFileName = [response suggestedFilename];
			if (!temporaryFileName) {
				temporaryFileName = @".tmp";
			}
			// Prefix the filename with a random UUID to avoid having file with the same file name during `moveItem`.
			NSString *fullTemporaryFileName = [NSString stringWithFormat:@"%@%@", [[NSUUID UUID] UUIDString], temporaryFileName];
			NSURL *temporaryURL = [[NSURL fileURLWithPath:NSTemporaryDirectory()] URLByAppendingPathComponent:fullTemporaryFileName];

			NSError *fileManagerError = nil;
			[NSFileManager.defaultManager moveItemAtURL:location toURL:temporaryURL error:&fileManagerError];
			if (fileManagerError) {
				self.contentHandler(self.bestAttemptContent);
				return;
			}

			NSError *attachmentError = nil;
			UNNotificationAttachment *attachment = [UNNotificationAttachment attachmentWithIdentifier:[temporaryURL absoluteString] URL:temporaryURL options:nil error:&attachmentError];
			if (attachmentError) {
				self.contentHandler(self.bestAttemptContent);
				return;
			}

			self.bestAttemptContent.attachments = @[attachment];
			self.contentHandler(self.bestAttemptContent);

			[NSFileManager.defaultManager removeItemAtURL:temporaryURL error:nil];
		}
	}] resume];
}

- (void)serviceExtensionTimeWillExpire {
	// Called just before the extension will be terminated by the system.
	// Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
	self.contentHandler(self.bestAttemptContent);
}

@end
