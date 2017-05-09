// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXAnalytics.h"
#import "EXFatalHandler.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXKernelLinkingManager.h"
#import "EXRemoteNotificationManager.h"
#import "EXLocalNotificationManager.h"
#import "EXViewController.h"

#import <Crashlytics/Crashlytics.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <GoogleSignIn/GoogleSignIn.h>
#import <GoogleMaps/GoogleMaps.h>
#import <AppAuth.h>

NSString * const EXAppDidRegisterForRemoteNotificationsNotification = @"EXAppDidRegisterForRemoteNotificationsNotification";

@interface ExpoKit () <CrashlyticsDelegate>
{
  Class _rootViewControllerClass;
}

@property (nonatomic, nullable, strong) EXViewController *rootViewController;
@property (nonatomic, nullable, strong) id<OIDAuthorizationFlowSession> currentAuthorizationFlow;

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

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didBeginOAuthFlow:)
                                                 name:@"EXDidBeginOAuthFlow"
                                               object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_onKernelJSLoaded)
                                                 name:kEXKernelJSIsLoadedNotification
                                               object:nil];
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

  [EXRemoteNotificationManager sharedInstance];
  // This is safe to call; if the app doesn't have permission to display user-facing notifications
  // then registering for a push token is a no-op
  [[EXRemoteNotificationManager sharedInstance] registerForRemoteNotifications];
  [self setLaunchOptions:launchOptions];
}

- (void)_onKernelJSLoaded
{
  NSDictionary *launchOptions = self.rootViewController.launchOptions;
  NSDictionary *remoteNotification = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
  if (remoteNotification) {
#ifndef EX_DETACHED
    [[EXRemoteNotificationManager sharedInstance] handleRemoteNotification:remoteNotification fromBackground:YES];
#endif
  }
  
  UILocalNotification *localNotification = [launchOptions objectForKey:UIApplicationLaunchOptionsLocalNotificationKey];
  if (localNotification) {
    [[EXLocalNotificationManager sharedInstance] handleLocalNotification:localNotification fromBackground:YES];
  }
}

#pragma mark - Crash handling

- (void)crashlyticsDidDetectReportForLastExecution:(CLSReport *)report
{
  // set a persistent flag because we may not get a chance to take any action until a future execution of the app.
  [[NSUserDefaults standardUserDefaults] setBool:@(YES) forKey:kEXKernelClearJSCacheUserDefaultsKey];

  // block to ensure we save this key (in case the app crashes again)
  [[NSUserDefaults standardUserDefaults] synchronize];
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
  if ([_currentAuthorizationFlow resumeAuthorizationFlowWithURL:url]) {
    _currentAuthorizationFlow = nil;
    return YES;
  }

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
  return [EXKernelLinkingManager application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    NSURL *webpageURL = userActivity.webpageURL;
    NSString *path = [webpageURL path];
    if ([path hasPrefix:@"/@"]) {
      // TODO: don't want to launch more bridges when in detached state.
      [EXKernelLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
      return YES;
    } else {
      [[UIApplication sharedApplication] openURL:webpageURL];
      return YES;
    }
  } else {
    return NO;
  }
}

- (void)didBeginOAuthFlow:(NSNotification *)notification
{
  _currentAuthorizationFlow = notification.userInfo[@"authorizationFlow"];
}

@end
