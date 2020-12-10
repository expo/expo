// Copyright 2018-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>
#import <ABI39_0_0EXNotifications/ABI39_0_0EXNotificationSerializer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXScopedNotificationSerializer : ABI39_0_0EXNotificationSerializer

+ (NSDictionary *)serializedNotificationResponse:(UNNotificationResponse *)response;
+ (NSDictionary *)serializedNotification:(UNNotification *)notification;
+ (NSDictionary *)serializedNotificationRequest:(UNNotificationRequest *)notificationRequest;

@end

NS_ASSUME_NONNULL_END
