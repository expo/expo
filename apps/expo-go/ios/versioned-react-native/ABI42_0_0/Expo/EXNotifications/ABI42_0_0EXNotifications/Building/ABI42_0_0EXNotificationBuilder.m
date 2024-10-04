// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationBuilder.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0NSDictionary+EXNotificationsVerifyingClass.h>

@implementation ABI42_0_0EXNotificationBuilder

ABI42_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI42_0_0EXNotificationBuilder)];
}

- (UNMutableNotificationContent *)notificationContentFromRequest:(NSDictionary *)request
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  [content setTitle:[request objectForKey:@"title" verifyingClass:[NSString class]]];
  [content setSubtitle:[request objectForKey:@"subtitle" verifyingClass:[NSString class]]];
  [content setBody:[request objectForKey:@"body" verifyingClass:[NSString class]]];
  [content setLaunchImageName:[request objectForKey:@"launchImageName" verifyingClass:[NSString class]]];
  [content setBadge:[request objectForKey:@"badge" verifyingClass:[NSNumber class]]];
  [content setUserInfo:[request objectForKey:@"data" verifyingClass:[NSDictionary class]]];
  [content setCategoryIdentifier:[request objectForKey:@"categoryIdentifier" verifyingClass:[NSString class]]];
  if ([request[@"sound"] isKindOfClass:[NSNumber class]]) {
    [content setSound:[request[@"sound"] boolValue] ? [UNNotificationSound defaultSound] : nil];
  } else if ([request[@"sound"] isKindOfClass:[NSString class]]) {
    NSString *soundName = request[@"sound"];
    if ([@"default" isEqualToString:soundName]) {
      [content setSound:[UNNotificationSound defaultSound]];
    } else if ([@"defaultCritical" isEqualToString:soundName]) {
      if (@available(iOS 12.0, *)) {
        [content setSound:[UNNotificationSound defaultCriticalSound]];
      } else {
        [content setSound:[UNNotificationSound defaultSound]];
      }
    } else {
      [content setSound:[UNNotificationSound soundNamed:soundName]];
    }
  }
  NSMutableArray<UNNotificationAttachment *> *attachments = [NSMutableArray new];
  [[request objectForKey:@"attachments" verifyingClass:[NSArray class]] enumerateObjectsUsingBlock:^(NSDictionary * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
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
  NSString *identifier = [request objectForKey:@"identifier" verifyingClass:[NSString class]] ?: @"";
  NSURL *uri = [NSURL URLWithString:[request objectForKey:@"uri" verifyingClass:[NSString class]]];
  NSError *error = nil;
  UNNotificationAttachment *attachment = [UNNotificationAttachment attachmentWithIdentifier:identifier URL:uri options:[self attachmentOptionsFromRequest:request] error:&error];
  if (error) {
    ABI42_0_0UMLogWarn(@"[expo-notifications] Could not have created a notification attachment out of request: %@. Error: %@.", [request description], [error description]);
    return nil;
  }
  return attachment;
}

- (NSDictionary *)attachmentOptionsFromRequest:(NSDictionary *)request
{
  NSMutableDictionary *options = [NSMutableDictionary new];
  if ([request objectForKey:@"typeHint" verifyingClass:[NSString class]]) {
    options[UNNotificationAttachmentOptionsTypeHintKey] = request[@"typeHint"];
  }
  if ([request objectForKey:@"hideThumbnail" verifyingClass:[NSNumber class]]) {
    options[UNNotificationAttachmentOptionsThumbnailHiddenKey] = request[@"hideThumbnail"];
  }
  if ([request objectForKey:@"thumbnailClipArea" verifyingClass:[NSDictionary class]]) {
    NSDictionary *area = request[@"thumbnailClipArea"];
    NSNumber *x = [area objectForKey:@"x" verifyingClass:[NSNumber class]];
    NSNumber *y = [area objectForKey:@"y" verifyingClass:[NSNumber class]];
    NSNumber *width = [area objectForKey:@"width" verifyingClass:[NSNumber class]];
    NSNumber *height = [area objectForKey:@"height" verifyingClass:[NSNumber class]];
    CGRect areaRect = CGRectMake([x doubleValue], [y doubleValue], [width doubleValue], [height doubleValue]);
    options[UNNotificationAttachmentOptionsThumbnailClippingRectKey] = (__bridge id _Nullable)(CGRectCreateDictionaryRepresentation(areaRect));
  }
  if ([request objectForKey:@"thumbnailTime" verifyingClass:[NSNumber class]]) {
    options[UNNotificationAttachmentOptionsThumbnailTimeKey] = request[@"thumbnailTime"];
  }
  return options;
}

@end

