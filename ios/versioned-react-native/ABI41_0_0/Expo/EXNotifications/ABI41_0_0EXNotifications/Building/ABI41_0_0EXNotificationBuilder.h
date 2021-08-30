// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI41_0_0EXNotificationBuilder

- (UNMutableNotificationContent *)notificationContentFromRequest:(NSDictionary *)request;

@end

@interface ABI41_0_0EXNotificationBuilder : NSObject <ABI41_0_0UMInternalModule, ABI41_0_0EXNotificationBuilder>

@end

NS_ASSUME_NONNULL_END
