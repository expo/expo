// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationsAppDelegate.h>
#import <EXNotifications/EXUserNotificationsManager.h>
#import <UMCore/UMDefines.h>
#import <UMCore/UMModuleRegistryProvider.h>

@implementation EXNotificationsAppDelegate

UM_REGISTER_SINGLETON_MODULE(NotificationsAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  id<UNUserNotificationCenterDelegate> ourDelegate = (id<UNUserNotificationCenterDelegate>) [UMModuleRegistryProvider getSingletonModuleForClass:[EXUserNotificationsManager class]];
  id<UNUserNotificationCenterDelegate> setDelegate = [UNUserNotificationCenter currentNotificationCenter].delegate;

  if (!setDelegate) {
    [UNUserNotificationCenter currentNotificationCenter].delegate = ourDelegate;
  } else if (setDelegate != ourDelegate) {
    UMLogWarn(@"Notification delegate is not expo-notifications delegate. expo-notifications may not work properly. Expected: %@, received: %@", ourDelegate, setDelegate);
  }

  return false;
}

@end
