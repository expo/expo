// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

@protocol UMUserNotificationCenterProxyInterface <NSObject>

- (void)getNotificationSettingsWithCompletionHandler:(void(^)(UNNotificationSettings *settings))completionHandler;
- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL granted, NSError *__nullable error))completionHandler;

@end

