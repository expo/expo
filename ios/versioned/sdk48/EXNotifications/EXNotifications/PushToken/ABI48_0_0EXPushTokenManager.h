// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXSingletonModule.h>
#import <ABI48_0_0EXNotifications/ABI48_0_0EXPushTokenListener.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI48_0_0EXPushTokenManager

- (void)addListener:(id<ABI48_0_0EXPushTokenListener>)listener;
- (void)removeListener:(id<ABI48_0_0EXPushTokenListener>)listener;

@end

@interface ABI48_0_0EXPushTokenManager : ABI48_0_0EXSingletonModule <UIApplicationDelegate, ABI48_0_0EXPushTokenManager>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
