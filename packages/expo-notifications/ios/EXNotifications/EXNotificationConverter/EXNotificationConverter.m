// Copyright 2019-present 650 Industries. All rights reserved.

#import "EXNotificationConverter.h"
#import <UserNotifications/UNNotificationSound.h>

@implementation EXNotificationConverter

+ (NSMutableDictionary*)convertToDictionary:(UNNotificationContent*)notificationContent
{
  NSMutableDictionary *notification = [NSMutableDictionary new];
  notification[@"title"] = notificationContent.title;
  notification[@"body"] = notificationContent.body;
  notification[@"sound"] = @([UNNotificationSound defaultSound] == notificationContent.sound);
  notification[@"count"] = notificationContent.badge;
  notification[@"categoryId"] = notificationContent.categoryIdentifier;
  notification[@"data"] = notificationContent.userInfo[@"body"];
  notification[@"appId"] = notificationContent.userInfo[@"appId"];
  notification[@"id"] = notificationContent.userInfo[@"id"];
  
  return notification;
}

+ (UNMutableNotificationContent*)convertToNotificationContent:(NSDictionary *)payload
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  
  NSString *uniqueId = [[NSUUID new] UUIDString];
  
  content.title = payload[@"title"];
  content.body = payload[@"body"];
  
  if ([payload[@"sound"] boolValue]) {
    content.sound = [UNNotificationSound defaultSound];
  }
  
  if ([payload[@"count"] isKindOfClass:[NSNumber class]]) {
    content.badge = (NSNumber *)payload[@"count"];
  }
  
  if ([payload[@"categoryId"] isKindOfClass:[NSString class]]) {
    content.categoryIdentifier = payload[@"categoryId"];
  }
  
  content.userInfo = @{
                       @"body": payload[@"data"],
                       @"appId": payload[@"appId"],
                       @"id": uniqueId,
                       };
  
  return content;
}

@end
