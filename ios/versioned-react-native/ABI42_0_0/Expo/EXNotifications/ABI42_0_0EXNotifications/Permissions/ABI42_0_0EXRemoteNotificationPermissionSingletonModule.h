// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXRemoteNotificationPermissionDelegate

- (void)handleDidFinishRegisteringForRemoteNotifications;

@end

@protocol ABI42_0_0EXRemoteNotificationPermissionProgressPublisher

- (void)addDelegate:(id<ABI42_0_0EXRemoteNotificationPermissionDelegate>)delegate;
- (void)removeDelegate:(id<ABI42_0_0EXRemoteNotificationPermissionDelegate>)delegate;

@end

@interface ABI42_0_0EXRemoteNotificationPermissionSingletonModule : ABI42_0_0UMSingletonModule <UIApplicationDelegate, ABI42_0_0EXRemoteNotificationPermissionProgressPublisher>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
