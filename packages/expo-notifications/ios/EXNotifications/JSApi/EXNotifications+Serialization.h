// Copyright 2015-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>
#import <EXNotifications/EXNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXNotifications (Serialization)

- (NSDictionary *)eventFromNotificationContent:(UNNotificationContent *)notificationContent;
- (NSDictionary *)eventFromNotificationResponse:(UNNotificationResponse *)notificationResponse;

@end

NS_ASSUME_NONNULL_END
