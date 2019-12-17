// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <UMCore/UMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXPushTokenListener

- (void)onDidRegisterWithDeviceToken:(NSData *)token;
- (void)onDidFailToRegisterWithError:(NSError *)error;

@end

@interface EXPushTokenManager : UMSingletonModule <UIApplicationDelegate>

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

- (void)addListener:(id<EXPushTokenListener>)listener;
- (void)removeListener:(id<EXPushTokenListener>)listener;

@end

NS_ASSUME_NONNULL_END
