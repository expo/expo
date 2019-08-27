// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUserNotificationsDispatcher : NSObject <UNUserNotificationCenterDelegate>

+ (instancetype)sharedInstance;

@end

NS_ASSUME_NONNULL_END
