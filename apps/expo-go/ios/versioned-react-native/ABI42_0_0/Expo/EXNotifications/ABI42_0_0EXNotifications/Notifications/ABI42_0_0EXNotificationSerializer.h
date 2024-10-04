// Copyright 2018-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXNotificationSerializer : NSObject

+ (NSDictionary *)serializedNotification:(UNNotification *)notification;
+ (NSDictionary *)serializedNotificationRequest:(UNNotificationRequest *)notificationRequest;
+ (NSDictionary *)serializedNotificationResponse:(UNNotificationResponse *)notificationResponse;
+ (NSDictionary *)serializedNotificationContent:(UNNotificationRequest *)request;

@end

NS_ASSUME_NONNULL_END
