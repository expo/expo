// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMInternalModule.h>

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXNotificationBuilder

- (UNNotificationContent *)notificationContentFromRequest:(NSDictionary *)request;

@end

@interface EXNotificationBuilder : NSObject <UMInternalModule, EXNotificationBuilder>

@end

NS_ASSUME_NONNULL_END
