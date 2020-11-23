// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI40_0_0EXNotificationBuilder

- (UNMutableNotificationContent *)notificationContentFromRequest:(NSDictionary *)request;

@end

@interface ABI40_0_0EXNotificationBuilder : NSObject <ABI40_0_0UMInternalModule, ABI40_0_0EXNotificationBuilder>

@end

NS_ASSUME_NONNULL_END
