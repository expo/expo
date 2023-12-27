// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXSingletonModule.h>
#import <ABI43_0_0EXNotifications/ABI43_0_0EXPushTokenListener.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI43_0_0EXPushTokenManager

- (void)addListener:(id<ABI43_0_0EXPushTokenListener>)listener;
- (void)removeListener:(id<ABI43_0_0EXPushTokenListener>)listener;

@end

@interface ABI43_0_0EXPushTokenManager : ABI43_0_0EXSingletonModule <UIApplicationDelegate, ABI43_0_0EXPushTokenManager>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
