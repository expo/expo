// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <UMCore/UMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXRemoteNotificationPermissionDelegate

- (void)handleDidFinishRegisteringForRemoteNotifications;

@end

@protocol EXRemoteNotificationPermissionProgressPublisher

- (void)addDelegate:(id<EXRemoteNotificationPermissionDelegate>)delegate;
- (void)removeDelegate:(id<EXRemoteNotificationPermissionDelegate>)delegate;

@end

@interface EXRemoteNotificationPermissionSingletonModule : UMSingletonModule <UIApplicationDelegate, EXRemoteNotificationPermissionProgressPublisher>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
