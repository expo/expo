// Copyright 2018-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXScopedNotificationsUtils : NSObject

+ (BOOL)shouldNotificationRequest:(UNNotificationRequest *)request beHandledByExperience:(NSString *)scopeKey;

+ (BOOL)shouldNotification:(UNNotification *)notification beHandledByExperience:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END
