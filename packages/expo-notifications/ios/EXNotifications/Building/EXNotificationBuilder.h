// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXInternalModule.h>

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXNotificationBuilder

- (UNMutableNotificationContent *)notificationContentFromRequest:(NSDictionary *)request;

@end

@interface EXNotificationBuilder : NSObject <EXInternalModule, EXNotificationBuilder>

@end

NS_ASSUME_NONNULL_END
