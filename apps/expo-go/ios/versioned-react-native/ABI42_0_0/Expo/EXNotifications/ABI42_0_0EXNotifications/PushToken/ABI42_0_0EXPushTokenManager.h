// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMSingletonModule.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0EXPushTokenListener.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXPushTokenManager

- (void)addListener:(id<ABI42_0_0EXPushTokenListener>)listener;
- (void)removeListener:(id<ABI42_0_0EXPushTokenListener>)listener;

@end

@interface ABI42_0_0EXPushTokenManager : ABI42_0_0UMSingletonModule <UIApplicationDelegate, ABI42_0_0EXPushTokenManager>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
