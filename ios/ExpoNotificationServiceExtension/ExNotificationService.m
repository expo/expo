// Copyright 2019-present 650 Industries. All rights reserved.

#include <CoreGraphics/CGGeometry.h>
#import "ExNotificationService.h"

@interface ExNotificationService ()

@property (nonatomic, strong) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong) UNMutableNotificationContent *bestAttemptContent;

@end

@implementation ExNotificationService

- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
  self.contentHandler = contentHandler;
  self.bestAttemptContent = [request.content mutableCopy];


  NSString *attachmentMediaURLString = nil;
  NSDictionary *attachmentMediaOptions = @{};

  NSDictionary *userInfo = request.content.userInfo;
  if (userInfo && userInfo[@"body"] && userInfo[@"body"][@"_richContent"]) {
    NSDictionary *richContent = userInfo[@"body"][@"_richContent"];
    // Display priority: video > audio > image.
    for (NSString* attachmentType in @[@"video", @"audio", @"image"]) {
      if (richContent[attachmentType]) {
        if ([richContent[attachmentType] isKindOfClass:[NSString class]]) {
          attachmentMediaURLString = richContent[attachmentType];
        } else {
          attachmentMediaURLString = richContent[attachmentType][@"url"];
          attachmentMediaOptions = richContent[attachmentType][@"options"];
        }
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

      NSMutableDictionary *options = [NSMutableDictionary dictionary];
      if (attachmentMediaOptions[@"thumbnailHidden"] && [attachmentMediaOptions[@"thumbnailHidden"] boolValue]) {
        options[UNNotificationAttachmentOptionsThumbnailHiddenKey] = @YES;
      }
      if (attachmentMediaOptions[@"thumbnailTime"] && [attachmentMediaOptions[@"thumbnailTime"] isKindOfClass:[NSNumber class]]) {
        options[UNNotificationAttachmentOptionsThumbnailTimeKey] = attachmentMediaOptions[@"thumbnailTime"];
      }
      if (attachmentMediaOptions[@"thumbnailClippingRect"]) {
        NSDictionary *clippingRectOptions = attachmentMediaOptions[@"thumbnailClippingRect"];
        CGRect clippingRect = CGRectMake([clippingRectOptions[@"x"] doubleValue], [clippingRectOptions[@"y"] doubleValue], [clippingRectOptions[@"width"] doubleValue], [clippingRectOptions[@"height"] doubleValue]);
        options[UNNotificationAttachmentOptionsThumbnailClippingRectKey] = (__bridge id _Nullable)CGRectCreateDictionaryRepresentation(clippingRect);
      }

      NSError *attachmentError = nil;
      UNNotificationAttachment *attachment = [UNNotificationAttachment attachmentWithIdentifier:[temporaryURL absoluteString] URL:temporaryURL options:options error:&attachmentError];
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
