// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXInternalModule.h>

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI45_0_0EXNotificationBuilder

- (UNMutableNotificationContent *)notificationContentFromRequest:(NSDictionary *)request;

@end

@interface ABI45_0_0EXNotificationBuilder : NSObject <ABI45_0_0EXInternalModule, ABI45_0_0EXNotificationBuilder>

@end

NS_ASSUME_NONNULL_END
