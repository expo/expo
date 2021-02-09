// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI39_0_0EXRemoteNotificationPermissionDelegate

- (void)handleDidFinishRegisteringForRemoteNotifications;

@end

@protocol ABI39_0_0EXRemoteNotificationPermissionProgressPublisher

- (void)addDelegate:(id<ABI39_0_0EXRemoteNotificationPermissionDelegate>)delegate;
- (void)removeDelegate:(id<ABI39_0_0EXRemoteNotificationPermissionDelegate>)delegate;

@end

@interface ABI39_0_0EXRemoteNotificationPermissionSingletonModule : ABI39_0_0UMSingletonModule <UIApplicationDelegate, ABI39_0_0EXRemoteNotificationPermissionProgressPublisher>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
