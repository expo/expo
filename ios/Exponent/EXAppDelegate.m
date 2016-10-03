// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppDelegate.h"

@import ObjectiveC;

#import "EXFileDownloader.h"

#import "Amplitude.h"
#import <CocoaLumberjack/CocoaLumberjack.h>
#import <Crashlytics/Crashlytics.h>
#import <Fabric/Fabric.h>
#if DEBUG
#import <SimulatorStatusMagic/SDStatusBarManager.h>
#endif
#import <FBSDKCoreKit/FBSDKCoreKit.h>

#import "EXRootViewController.h"
#import "EXConstants.h"
#import "EXFatalHandler.h"
#import "EXKernel.h"
#import "EXKeys.h"
#import "EXRemoteNotificationManager.h"
#import "EXShellManager.h"

NS_ASSUME_NONNULL_BEGIN

NSString * const EXAppDidRegisterForRemoteNotificationsNotification = @"EXAppDidRegisterForRemoteNotificationsNotification";

@implementation EXAppDelegate {
  NSDictionary *_launchOptions;
}

- (BOOL)application:(UIApplication *)application willFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  _launchOptions = launchOptions;

  [DDLog addLogger:[DDASLLogger sharedInstance]];
  [DDLog addLogger:[DDTTYLogger sharedInstance]];
  return YES;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [Fabric with:@[CrashlyticsKit]];
  [CrashlyticsKit setObjectValue:[EXConstants getExponentClientVersion] forKey:@"exp_client_version"];
  
  RCTSetFatalHandler(handleFatalReactError);

#if SNAPSHOT
  [SDStatusBarManager sharedInstance].timeString = @"6:50 PM";
  [[SDStatusBarManager sharedInstance] enableOverrides];
#endif
  
#if DEBUG
  [[Amplitude instance] initializeApiKey:AMPLITUDE_DEV_KEY];
#else
  [[Amplitude instance] initializeApiKey:AMPLITUDE_KEY];
#endif

  [[FBSDKApplicationDelegate sharedInstance] application:application
                           didFinishLaunchingWithOptions:launchOptions];

  _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _window.backgroundColor = [UIColor whiteColor];
  _rootViewController = [[EXRootViewController alloc] initWithLaunchOptions:_launchOptions];
  _window.rootViewController = _rootViewController;

  [_rootViewController loadReactApplication];
  [_window makeKeyAndVisible];

  [EXRemoteNotificationManager sharedInstance];
  NSDictionary *remoteNotification = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
  if (remoteNotification || application.applicationIconBadgeNumber > 0) {
    [[EXRemoteNotificationManager sharedInstance] handleRemoteNotification:remoteNotification fromBackground:YES];
  }

  return YES;
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  [_rootViewController applicationWillEnterForeground];
}

- (void)applicationWillTerminate:(UIApplication *)application
{
#if DEBUG
  [[SDStatusBarManager sharedInstance] disableOverrides];
#endif
}

#pragma mark - Handling URLs

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  if ([[FBSDKApplicationDelegate sharedInstance] application:application
                                                 openURL:url
                                       sourceApplication:sourceApplication
                                                  annotation:annotation]) {
    return YES;
  }
  return [EXKernel application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    NSURL *webpageURL = userActivity.webpageURL;
    NSString *path = [webpageURL path];
    if ([path hasPrefix:@"/@"]) {
      [EXKernel application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
      return YES;
    } else {
      [[UIApplication sharedApplication] openURL:webpageURL];
      return YES;
    }
  } else {
    return NO;
  }
}

#pragma mark - Notifications

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token
{
  [[EXRemoteNotificationManager sharedInstance] registerAPNSToken:token];
  [[NSNotificationCenter defaultCenter] postNotificationName:EXAppDidRegisterForRemoteNotificationsNotification object:nil];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err
{
  DDLogWarn(@"Failed to register for remote notifs: %@", err);
  [[EXRemoteNotificationManager sharedInstance] registerAPNSToken:nil];

  // Post this even in the failure case -- up to subscribers to subsequently read the system permission state
  [[NSNotificationCenter defaultCenter] postNotificationName:EXAppDidRegisterForRemoteNotificationsNotification object:nil];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  BOOL isFromBackground = !(application.applicationState == UIApplicationStateActive);
  [[EXRemoteNotificationManager sharedInstance] handleRemoteNotification:notification fromBackground:isFromBackground];
}

@end

NS_ASSUME_NONNULL_END
