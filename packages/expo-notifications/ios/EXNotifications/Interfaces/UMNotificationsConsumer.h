// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/UMNotificationTokenListener.h>
#import <UserNotifications/UserNotifications.h>

@protocol UMNotificationsConsumer

// Returns an array of events that haven't been consumed by the consumer.
- (NSArray *)consumeNotificationEvents:(NSArray *)events;

// Returns whether the response has been handled by the consumer.
- (BOOL)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler;

// Returns whether the notification has been handled by the consumer.
- (BOOL)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler;

@end
