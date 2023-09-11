// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXInternalModule.h>

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI47_0_0EXNotificationBuilder

- (UNMutableNotificationContent *)notificationContentFromRequest:(NSDictionary *)request;

@end

@interface ABI47_0_0EXNotificationBuilder : NSObject <ABI47_0_0EXInternalModule, ABI47_0_0EXNotificationBuilder>

@end

NS_ASSUME_NONNULL_END
