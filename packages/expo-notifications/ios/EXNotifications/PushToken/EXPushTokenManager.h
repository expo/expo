// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ExpoModulesCore/EXSingletonModule.h>
#import <EXNotifications/EXPushTokenListener.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXPushTokenManager

- (void)addListener:(id<EXPushTokenListener>)listener;
- (void)removeListener:(id<EXPushTokenListener>)listener;

@end

@interface EXPushTokenManager : EXSingletonModule <UIApplicationDelegate, EXPushTokenManager>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
