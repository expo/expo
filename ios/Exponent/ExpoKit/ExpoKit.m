// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXViewController.h"
#import "EXAnalytics.h"
#import "EXBuildConstants.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXKernelLinkingManager.h"
#import "EXReactAppExceptionHandler.h"
#import "EXRemoteNotificationManager.h"

#import <Crashlytics/Crashlytics.h>
#import <GoogleMaps/GoogleMaps.h>

NSString * const EXAppDidRegisterForRemoteNotificationsNotification = @"kEXAppDidRegisterForRemoteNotificationsNotification";
NSString * const EXAppDidRegisterUserNotificationSettingsNotification = @"kEXAppDidRegisterUserNotificationSettingsNotification";

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
  [DDLog addLogger:[DDOSLogger sharedInstance]];
  

  RCTSetFatalHandler(handleFatalReactError);

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

  [UNUserNotificationCenter currentNotificationCenter].delegate = (id<UNUserNotificationCenterDelegate>) [EXKernel sharedInstance].serviceRegistry.notificationsManager;
  // This is safe to call; if the app doesn't have permission to display user-facing notifications
  // then registering for a push token is a no-op
  [[EXKernel sharedInstance].serviceRegistry.remoteNotificationManager registerForRemoteNotifications];
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
  [[NSNotificationCenter defaultCenter] postNotificationName:EXAppDidRegisterForRemoteNotificationsNotification object:nil userInfo:@{ @"token": token }];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err
{
  DDLogWarn(@"Failed to register for remote notifs: %@", err);
  [[EXKernel sharedInstance].serviceRegistry.remoteNotificationManager registerAPNSToken:nil registrationError:err];

  // Post this even in the failure case -- up to subscribers to subsequently read the system permission state
  [[NSNotificationCenter defaultCenter] postNotificationName:EXAppDidRegisterForRemoteNotificationsNotification object:nil];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler {

  // Here background task execution should go.

  completionHandler(UIBackgroundFetchResultNoData);
}

#pragma mark - deep linking hooks

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  return [EXKernelLinkingManager application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    NSURL *webpageURL = userActivity.webpageURL;
    if ([EXEnvironment sharedEnvironment].isDetached) {
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
        [application openURL:webpageURL options:@{} completionHandler:nil];
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
