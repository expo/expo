// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI46_0_0EXRemoteNotificationPermissionDelegate

- (void)handleDidFinishRegisteringForRemoteNotifications;

@end

@protocol ABI46_0_0EXRemoteNotificationPermissionProgressPublisher

- (void)addDelegate:(id<ABI46_0_0EXRemoteNotificationPermissionDelegate>)delegate;
- (void)removeDelegate:(id<ABI46_0_0EXRemoteNotificationPermissionDelegate>)delegate;

@end

@interface ABI46_0_0EXRemoteNotificationPermissionSingletonModule : ABI46_0_0EXSingletonModule <UIApplicationDelegate, ABI46_0_0EXRemoteNotificationPermissionProgressPublisher>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
