// Copyright 2018-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXNotificationSerializer : NSObject

+ (NSDictionary<NSString *, NSObject *> *)serializedNotification:(UNNotification *)notification;
+ (NSDictionary<NSString *, NSObject *> *)serializedNotificationRequest:(UNNotificationRequest *)notificationRequest;
+ (NSDictionary<NSString *, NSObject *> *)serializedNotificationResponse:(UNNotificationResponse *)notificationResponse;
+ (NSDictionary<NSString *, NSObject *> *)serializedNotificationContent:(UNNotificationRequest *)request;

@end

NS_ASSUME_NONNULL_END
