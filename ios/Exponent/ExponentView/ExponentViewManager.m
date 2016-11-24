// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExponentViewManager.h"
#import "EXFatalHandler.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXKeys.h"
#import "EXRemoteNotificationManager.h"
#import "EXLocalNotificationManager.h"
#import "EXViewController.h"

#import "Amplitude.h"
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <GoogleSignIn/GoogleSignIn.h>

NSString * const EXAppDidRegisterForRemoteNotificationsNotification = @"EXAppDidRegisterForRemoteNotificationsNotification";

@interface ExponentViewManager ()
{
  Class _rootViewControllerClass;
}

@property (nonatomic, nullable, strong) EXViewController *rootViewController;

@end

@implementation ExponentViewManager

+ (nonnull instancetype)sharedInstance
{
  static ExponentViewManager *theExponent = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theExponent) {
      theExponent = [[ExponentViewManager alloc] init];
    }
  });
  return theExponent;
}

- (instancetype)init
{
  if (self = [super init]) {
    _rootViewControllerClass = [EXViewController class];
  }
  return self;
}

- (void)registerRootViewControllerClass:(Class)rootViewControllerClass
{
  NSAssert([rootViewControllerClass isSubclassOfClass:[EXViewController class]], @"ExponentViewManager root view controller class must subclass EXViewController.");
  _rootViewControllerClass = rootViewControllerClass;
}

- (EXViewController *)rootViewController
{
  if (!_rootViewController) {
    _rootViewController = [[_rootViewControllerClass alloc] initWithLaunchOptions:@{}];
  }
  return _rootViewController;
}

#pragma mark - misc AppDelegate hooks

- (void)setLaunchOptions:(NSDictionary *)launchOptions
{
  self.rootViewController.appManager.launchOptions = launchOptions;
}

- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [DDLog addLogger:[DDASLLogger sharedInstance]];
  [DDLog addLogger:[DDTTYLogger sharedInstance]];

  RCTSetFatalHandler(handleFatalReactError);
  
  [[FBSDKApplicationDelegate sharedInstance] application:application
                           didFinishLaunchingWithOptions:launchOptions];
  
  // TODO: open up an api for this in ExponentView
#if DEBUG
  [[Amplitude instance] initializeApiKey:AMPLITUDE_DEV_KEY];
#else
  [[Amplitude instance] initializeApiKey:AMPLITUDE_KEY];
#endif
  
  [EXRemoteNotificationManager sharedInstance];
  [self setLaunchOptions:launchOptions];

  NSDictionary *remoteNotification = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
  if (remoteNotification || application.applicationIconBadgeNumber > 0) {
    [[EXRemoteNotificationManager sharedInstance] handleRemoteNotification:remoteNotification fromBackground:YES];
  }
}

#pragma mark - APNS hooks

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

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  BOOL isFromBackground = !(application.applicationState == UIApplicationStateActive);
  [[EXLocalNotificationManager sharedInstance] handleLocalNotification:notification fromBackground:isFromBackground];
}

#pragma mark - deep linking hooks

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
  // TODO: don't want to launch more bridges when in detached state.
  return [EXKernel application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    NSURL *webpageURL = userActivity.webpageURL;
    NSString *path = [webpageURL path];
    if ([path hasPrefix:@"/@"]) {
      // TODO: don't want to launch more bridges when in detached state.
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

@end
