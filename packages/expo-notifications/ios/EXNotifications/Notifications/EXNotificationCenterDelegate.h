// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ExpoModulesCore/EXSingletonModule.h>
#import <UserNotifications/UserNotifications.h>
#import <EXNotifications/EXNotificationsDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXNotificationCenterDelegate

- (void)addDelegate:(id<EXNotificationsDelegate>)delegate;
- (void)removeDelegate:(id<EXNotificationsDelegate>)delegate;
- (nullable UNNotificationResponse *)lastNotificationResponse;
- (void)setLastNotificationResponse:(nullable UNNotificationResponse *)response;

@end

@interface EXNotificationCenterDelegate : EXSingletonModule <UIApplicationDelegate, UNUserNotificationCenterDelegate, EXNotificationCenterDelegate>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey,id> *)launchOptions;
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler;
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler;
- (void)userNotificationCenter:(UNUserNotificationCenter *)center openSettingsForNotification:(nullable UNNotification *)notification;

@property (nonatomic, strong, nullable) UNNotificationResponse *lastNotificationResponse;

@end

NS_ASSUME_NONNULL_END
