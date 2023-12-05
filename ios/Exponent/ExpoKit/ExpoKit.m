// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXViewController.h"
#import "EXBuildConstants.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXKernelLinkingManager.h"
#import "EXReactAppExceptionHandler.h"

#if __has_include(<EXNotifications/EXNotificationCenterDelegate.h>)
#import <EXNotifications/EXNotificationCenterDelegate.h>
#endif

#import <ExpoModulesCore/EXModuleRegistryProvider.h>

#import <GoogleMaps/GoogleMaps.h>

NSString * const EXAppDidRegisterForRemoteNotificationsNotification = @"kEXAppDidRegisterForRemoteNotificationsNotification";
NSString * const EXAppDidRegisterUserNotificationSettingsNotification = @"kEXAppDidRegisterUserNotificationSettingsNotification";

@interface ExpoKit ()
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

- (void)prepareWithLaunchOptions:(nullable NSDictionary *)launchOptions
{
  [DDLog addLogger:[DDOSLogger sharedInstance]];
  RCTSetFatalHandler(handleFatalReactError);

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

  _launchOptions = launchOptions;
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
      if (![path isEqualToString:@"/expo-go"]) {
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
