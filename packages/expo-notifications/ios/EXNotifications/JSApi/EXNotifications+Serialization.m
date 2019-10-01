// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotifications+Serialization.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXNotifications (Serialization)

- (NSDictionary *)eventFromNotificationContent:(UNNotificationContent *)notificationContent
{
  NSMutableDictionary *event = [NSMutableDictionary new];
  event[@"title"] = notificationContent.title;
  event[@"body"] = notificationContent.body;
  event[@"sound"] = @(!!notificationContent.sound);
  event[@"count"] = notificationContent.badge;
  event[@"categoryId"] = notificationContent.categoryIdentifier;
  event[@"data"] = notificationContent.userInfo[@"body"];
  event[@"id"] = notificationContent.userInfo[@"id"];
  return event;
}

- (NSDictionary *)eventFromNotificationResponse:(UNNotificationResponse *)response
{
  NSMutableDictionary *responseEvent = [NSMutableDictionary new];

  UNNotificationTrigger *trigger = response.notification.request.trigger;
  responseEvent[@"remote"] = @([trigger isKindOfClass:[UNPushNotificationTrigger class]]);

  NSString *actionIdentifier = response.actionIdentifier;
  responseEvent[@"actionId"] = actionIdentifier != UNNotificationDefaultActionIdentifier ? actionIdentifier : [NSNull null];

  if ([response isKindOfClass:[UNTextInputNotificationResponse class]]) {
    UNTextInputNotificationResponse *textInputResponse = (UNTextInputNotificationResponse *)response;
    responseEvent[@"userText"] = textInputResponse.userText;
  }

  NSDictionary *contentEvent = [self eventFromNotificationContent:response.notification.request.content];
  [responseEvent addEntriesFromDictionary:contentEvent];

  return responseEvent;
}

@end

NS_ASSUME_NONNULL_END
