// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMSingletonModule.h>
#import <ABI41_0_0EXNotifications/ABI41_0_0EXPushTokenListener.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI41_0_0EXPushTokenManager

- (void)addListener:(id<ABI41_0_0EXPushTokenListener>)listener;
- (void)removeListener:(id<ABI41_0_0EXPushTokenListener>)listener;

@end

@interface ABI41_0_0EXPushTokenManager : ABI41_0_0UMSingletonModule <UIApplicationDelegate, ABI41_0_0EXPushTokenManager>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
