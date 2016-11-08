// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXAppDelegate.h"

#import "Amplitude.h"
#import <CocoaLumberjack/CocoaLumberjack.h>
#import <Crashlytics/Crashlytics.h>
#import <Fabric/Fabric.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <GoogleSignIn/GoogleSignIn.h>

#import "ExponentViewManager.h"
#import "EXRootViewController.h"
#import "EXConstants.h"
#import "EXFatalHandler.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXKeys.h"
#import "EXShellManager.h"

NS_ASSUME_NONNULL_BEGIN

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

#if DEBUG
  [[Amplitude instance] initializeApiKey:AMPLITUDE_DEV_KEY];
#else
  [[Amplitude instance] initializeApiKey:AMPLITUDE_KEY];
#endif

  [[FBSDKApplicationDelegate sharedInstance] application:application
                           didFinishLaunchingWithOptions:launchOptions];
  [[ExponentViewManager sharedInstance] registerRootViewControllerClass:[EXRootViewController class]];
  [[ExponentViewManager sharedInstance] application:application didFinishLaunchingWithOptions:launchOptions];

  _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _window.backgroundColor = [UIColor whiteColor];
  _rootViewController = (EXRootViewController *)[ExponentViewManager sharedInstance].rootViewController;
  _window.rootViewController = _rootViewController;

  [_rootViewController loadReactApplication];
  [_window makeKeyAndVisible];

  return YES;
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  [_rootViewController applicationWillEnterForeground];
}

#pragma mark - Handling URLs

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  if ([[GIDSignIn sharedInstance] handleURL:url
                          sourceApplication:sourceApplication
                                 annotation:annotation]) {
    return YES;
  }

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
  [[ExponentViewManager sharedInstance] application:application didRegisterForRemoteNotificationsWithDeviceToken:token];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err
{
  [[ExponentViewManager sharedInstance] application:application didFailToRegisterForRemoteNotificationsWithError:err];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  [[ExponentViewManager sharedInstance] application:application didReceiveRemoteNotification:notification];
}

@end

NS_ASSUME_NONNULL_END
