// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXViewController.h"
#import "EXAnalytics.h"
#import "EXBuildConstants.h"
#import "EXFacebook.h"
#import "EXGoogleAuthManager.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXKernelLinkingManager.h"
#import "EXReactAppExceptionHandler.h"
#import "EXRemoteNotificationManager.h"
#import "EXLocalNotificationManager.h"
#import "EXBranchManager.h"
#import "EXShellManager.h"

#import <Crashlytics/Crashlytics.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <GoogleMaps/GoogleMaps.h>

NSString * const EXAppDidRegisterForRemoteNotificationsNotification = @"EXAppDidRegisterForRemoteNotificationsNotification";
NSString * const EXAppDidRegisterUserNotificationSettingsNotification = @"EXAppDidRegisterUserNotificationSettingsNotification";

@interface ExpoKit () <CrashlyticsDelegate>
{
  Class _rootViewControllerClass;
}

@property (nonatomic, nullable, strong) EXViewController *rootViewController;
@property (nonatomic, strong) NSDictionary *launchOptions;

@end

@implementation ExpoKit

+ (nonnull instancetype)sharedInstance
{
  static ExpoKit *theExpoKit = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theExpoKit) {
      theExpoKit = [[ExpoKit alloc] init];
    }
  });
  return theExpoKit;
}

- (instancetype)init
{
  if (self = [super init]) {
    _rootViewControllerClass = [EXViewController class];
    [self _initDefaultKeys];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)registerRootViewControllerClass:(Class)rootViewControllerClass
{
  NSAssert([rootViewControllerClass isSubclassOfClass:[EXViewController class]], @"ExpoKit root view controller class must subclass EXViewController.");
  _rootViewControllerClass = rootViewControllerClass;
}

- (EXViewController *)rootViewController
{
  if (!_rootViewController) {
    _rootViewController = [[_rootViewControllerClass alloc] init];
    _rootViewController.delegate = [EXKernel sharedInstance];
  }
  return _rootViewController;
}

- (UIViewController *)currentViewController
{
  EXViewController *rootViewController = [self rootViewController];
  UIViewController *controller = [rootViewController contentViewController];
  while (controller.presentedViewController != nil) {
    controller = controller.presentedViewController;
  }
  return controller;
}

#pragma mark - misc AppDelegate hooks

- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  if (@available(iOS 10, *)) {
    [DDLog addLogger:[DDOSLogger sharedInstance]];
  } else {
    [DDLog addLogger:[DDASLLogger sharedInstance]];
    [DDLog addLogger:[DDTTYLogger sharedInstance]];
  }

  RCTSetFatalHandler(handleFatalReactError);

  if ([EXFacebook facebookAppIdFromNSBundle]) {
    [[FBSDKApplicationDelegate sharedInstance] application:application
                             didFinishLaunchingWithOptions:launchOptions];
  }

  // init analytics
  [EXAnalytics sharedInstance];

  NSString *standaloneGMSKey = [[NSBundle mainBundle].infoDictionary objectForKey:@"GMSApiKey"];
  if (standaloneGMSKey && standaloneGMSKey.length) {
    [GMSServices provideAPIKey:standaloneGMSKey];
  } else {
    if (_applicationKeys[@"GOOGLE_MAPS_IOS_API_KEY"]) {// we may define this as empty
      if ([_applicationKeys[@"GOOGLE_MAPS_IOS_API_KEY"] length]) {
        [GMSServices provideAPIKey:_applicationKeys[@"GOOGLE_MAPS_IOS_API_KEY"]];
      }
    }
  }

  // This is safe to call; if the app doesn't have permission to display user-facing notifications
  // then registering for a push token is a no-op
  [[EXKernel sharedInstance].serviceRegistry.remoteNotificationManager registerForRemoteNotifications];
  [[EXKernel sharedInstance].serviceRegistry.branchManager application:application didFinishLaunchingWithOptions:launchOptions];
  _launchOptions = launchOptions;
}

#pragma mark - Crash handling

- (void)crashlyticsDidDetectReportForLastExecution:(CLSReport *)report
{
  // set a persistent flag because we may not get a chance to take any action until a future execution of the app.
  [[NSUserDefaults standardUserDefaults] setBool:YES forKey:kEXKernelClearJSCacheUserDefaultsKey];

  // block to ensure we save this key (in case the app crashes again)
  [[NSUserDefaults standardUserDefaults] synchronize];
}

#pragma mark - APNS hooks

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token
{
  [[EXKernel sharedInstance].serviceRegistry.remoteNotificationManager registerAPNSToken:token registrationError:nil];
  [[NSNotificationCenter defaultCenter] postNotificationName:EXAppDidRegisterForRemoteNotificationsNotification object:nil];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err
{
  DDLogWarn(@"Failed to register for remote notifs: %@", err);
  [[EXKernel sharedInstance].serviceRegistry.remoteNotificationManager registerAPNSToken:nil registrationError:err];

  // Post this even in the failure case -- up to subscribers to subsequently read the system permission state
  [[NSNotificationCenter defaultCenter] postNotificationName:EXAppDidRegisterForRemoteNotificationsNotification object:nil];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  BOOL isFromBackground = !(application.applicationState == UIApplicationStateActive);
  [[EXKernel sharedInstance].serviceRegistry.remoteNotificationManager handleRemoteNotification:notification fromBackground:isFromBackground];
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  BOOL isFromBackground = !(application.applicationState == UIApplicationStateActive);
  [[EXLocalNotificationManager sharedInstance] handleLocalNotification:notification fromBackground:isFromBackground];
}

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(nonnull UIUserNotificationSettings *)notificationSettings
{
  [[NSNotificationCenter defaultCenter] postNotificationName:EXAppDidRegisterUserNotificationSettingsNotification object:nil];
}

#pragma mark - deep linking hooks

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  if ([[EXKernel sharedInstance].serviceRegistry.googleAuthManager
       application:application openURL:url sourceApplication:sourceApplication annotation:annotation]) {
    return YES;
  }

  if ([EXFacebook facebookAppIdFromNSBundle]) {
    if ([[FBSDKApplicationDelegate sharedInstance] application:application
                                                       openURL:url
                                             sourceApplication:sourceApplication
                                                    annotation:annotation]) {
      return YES;
    }
  }

  if ([[EXKernel sharedInstance].serviceRegistry.branchManager
       application:application
       openURL:url
       sourceApplication:sourceApplication
       annotation:annotation]) {
    return YES;
  }

  return [EXKernelLinkingManager application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler
{
  if ([[EXKernel sharedInstance].serviceRegistry.branchManager
       application:application
       continueUserActivity:userActivity
       restorationHandler:restorationHandler]) {
    return YES;
  }
  
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    NSURL *webpageURL = userActivity.webpageURL;
    if ([EXShellManager sharedInstance].isShell) {
      return [EXKernelLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
    } else {
      NSString *path = [webpageURL path];
      
      // Filter out URLs that don't match experience URLs since the AASA pattern's grammar is not as
      // expressive as we'd like and matches profile URLs too
      NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"^/@[a-z0-9_-]+/.+$"
                                                                             options:NSRegularExpressionCaseInsensitive
                                                                               error:nil];
      NSUInteger matchCount = [regex numberOfMatchesInString:path options:0 range:NSMakeRange(0, path.length)];
      
      if (matchCount > 0) {
        [EXKernelLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
        return YES;
      } else {
        [application openURL:webpageURL];
        return YES;
      }
    }
  }
  
  return NO;
}

#pragma mark - internal

- (void)_initDefaultKeys
{
  // these are provided in the expo/expo open source repo as defaults; they can all be overridden by setting
  // the `applicationKeys` property on ExpoKit.
  if ([EXBuildConstants sharedInstance].defaultApiKeys) {
    self.applicationKeys = [EXBuildConstants sharedInstance].defaultApiKeys;
  }
}

@end
