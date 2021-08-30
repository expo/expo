/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTEventEmitter.h>

extern NSString *const ABI41_0_0RCTRemoteNotificationReceived;

@interface ABI41_0_0RCTPushNotificationManager : ABI41_0_0RCTEventEmitter

typedef void (^ABI41_0_0RCTRemoteNotificationCallback)(UIBackgroundFetchResult result);

#if !TARGET_OS_TV && !TARGET_OS_UIKITFORMAC
+ (void)didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings;
+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
+ (void)didReceiveRemoteNotification:(NSDictionary *)notification;
+ (void)didReceiveRemoteNotification:(NSDictionary *)notification fetchCompletionHandler:(ABI41_0_0RCTRemoteNotificationCallback)completionHandler;
+ (void)didReceiveLocalNotification:(UILocalNotification *)notification;
+ (void)didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;
#endif

@end
