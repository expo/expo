// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationsAppDelegate.h>
#import <EXNotifications/EXThreadSafeTokenDispatcher.h>
#import <EXNotifications/EXUserNotificationManager.h>

@implementation EXNotificationsAppDelegate

UM_REGISTER_SINGLETON_MODULE(EXNotificationAppDelegate)

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions {
  if (![UNUserNotificationCenter currentNotificationCenter].delegate) {
    [UNUserNotificationCenter currentNotificationCenter].delegate =
        [EXUserNotificationManager sharedInstance];
  }

  return false;
}

- (void)application:(UIApplication *)app
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken {
  [[EXThreadSafeTokenDispatcher sharedInstance] onNewToken:devToken];
}

- (void)application:(UIApplication *)app
    didFailToRegisterForRemoteNotificationsWithError:(NSError *)err {
}

@end
