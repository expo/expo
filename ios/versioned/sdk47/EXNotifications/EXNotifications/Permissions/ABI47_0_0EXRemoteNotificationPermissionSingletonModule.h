// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI47_0_0EXRemoteNotificationPermissionDelegate

- (void)handleDidFinishRegisteringForRemoteNotifications;

@end

@protocol ABI47_0_0EXRemoteNotificationPermissionProgressPublisher

- (void)addDelegate:(id<ABI47_0_0EXRemoteNotificationPermissionDelegate>)delegate;
- (void)removeDelegate:(id<ABI47_0_0EXRemoteNotificationPermissionDelegate>)delegate;

@end

@interface ABI47_0_0EXRemoteNotificationPermissionSingletonModule : ABI47_0_0EXSingletonModule <UIApplicationDelegate, ABI47_0_0EXRemoteNotificationPermissionProgressPublisher>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
