// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXNotificationBuilder

- (UNMutableNotificationContent *)notificationContentFromRequest:(NSDictionary *)request;

@end

@interface ABI42_0_0EXNotificationBuilder : NSObject <ABI42_0_0UMInternalModule, ABI42_0_0EXNotificationBuilder>

@end

NS_ASSUME_NONNULL_END
