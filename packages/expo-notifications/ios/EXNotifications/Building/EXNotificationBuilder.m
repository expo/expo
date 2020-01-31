// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationBuilder.h>

@implementation EXNotificationBuilder

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXNotificationBuilder)];
}

- (UNNotificationContent *)notificationContentFromRequest:(NSDictionary *)request
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  [content setTitle:request[@"title"]];
  [content setSubtitle:request[@"subtitle"]];
  [content setBody:request[@"message"]];
  [content setLaunchImageName:request[@"launchImageName"]];
  [content setBadge:request[@"badge"]];
  [content setUserInfo:request[@"body"]];
  if ([request objectForKey:@"sound"]) {
    [content setSound:[request[@"sound"] boolValue] ? [UNNotificationSound defaultSound] : nil];
  }
  NSMutableArray<UNNotificationAttachment *> *attachments = [NSMutableArray new];
  [request[@"attachments"] enumerateObjectsUsingBlock:^(NSDictionary * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    UNNotificationAttachment *attachment = [self attachmentFromRequest:obj];
    if (attachment) {
      [attachments addObject:attachment];
    }
  }];
  [content setAttachments:attachments];
  return content;
}

- (UNNotificationAttachment *)attachmentFromRequest:(NSDictionary *)request
{
  NSString *identifier = request[@"identifier"] ?: @"";
  NSURL *uri = [NSURL URLWithString:request[@"uri"]];
  NSError *error = nil;
  UNNotificationAttachment *attachment = [UNNotificationAttachment attachmentWithIdentifier:identifier URL:uri options:[self attachmentOptionsFromRequest:request] error:&error];
  if (error) {
    UMLogWarn(@"[expo-notifications] Could not have created a notification attachment out of request: %@. Error: %@.", [request description], [error description]);
    return nil;
  }
  return attachment;
}

- (NSDictionary *)attachmentOptionsFromRequest:(NSDictionary *)request
{
  NSMutableDictionary *options = [NSMutableDictionary new];
  if (request[@"typeHint"]) {
    options[UNNotificationAttachmentOptionsTypeHintKey] = request[@"typeHint"];
  }
  if (request[@"hideThumbnail"]) {
    options[UNNotificationAttachmentOptionsThumbnailHiddenKey] = request[@"hideThumbnail"];
  }
  if (request[@"thumbnailClipArea"]) {
    NSDictionary *area = request[@"thumbnailClipArea"];
    CGRect areaRect = CGRectMake([area[@"x"] doubleValue], [area[@"y"] doubleValue], [area[@"width"] doubleValue], [area[@"height"] doubleValue]);
    options[UNNotificationAttachmentOptionsThumbnailClippingRectKey] = (__bridge id _Nullable)(CGRectCreateDictionaryRepresentation(areaRect));
  }
  if (request[@"thumbnailTime"]) {
    options[UNNotificationAttachmentOptionsThumbnailClippingRectKey] = request[@"thumbnailTime"];
  }
  return options;
}

@end
