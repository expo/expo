// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXViewController.h"
#import "EXStandaloneAppDelegate.h"

#import <UMCore/UMModuleRegistryProvider.h>

#if __has_include(<EXAppAuth/EXAppAuthSessionsManager.h>)
#import <EXAppAuth/EXAppAuthSessionsManager.h>
#endif

#if __has_include(<GoogleSignIn/GoogleSignIn.h>)
#import <GoogleSignIn/GoogleSignIn.h>
#endif

#if __has_include(<EXTaskManager/EXTaskService.h>)
#import <EXTaskManager/EXTaskService.h>
#endif

#if __has_include(<EXFacebook/EXFacebook.h>)
#import <EXFacebook/EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#endif

@interface EXStandaloneAppDelegate ()

@property (nonatomic, strong) EXViewController *rootViewController;

@end

@implementation EXStandaloneAppDelegate

@synthesize window = _window;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#if __has_include(<EXFacebook/EXFacebook.h>)
  if ([EXFacebook facebookAppIdFromNSBundle]) {
    [[FBSDKApplicationDelegate sharedInstance] application:application
                             didFinishLaunchingWithOptions:launchOptions];
  }
#endif
  if ([application applicationState] != UIApplicationStateBackground) {
    // App launched in foreground
    [self _setUpUserInterfaceForApplication:application withLaunchOptions:launchOptions];
  }
#if __has_include(<EXTaskManager/EXTaskService.h>)
  [(EXTaskService *)[UMModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
#endif

  [super application:application didFinishLaunchingWithOptions:launchOptions];

  return YES;
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  [self _setUpUserInterfaceForApplication:application withLaunchOptions:nil];

  [super applicationWillEnterForeground:application];
}

- (void)_setUpUserInterfaceForApplication:(UIApplication *)application withLaunchOptions:(nullable NSDictionary *)launchOptions
{
  if (_window) {
    return;
  }
  [[ExpoKit sharedInstance] application:application didFinishLaunchingWithOptions:launchOptions];

  _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _window.backgroundColor = [UIColor whiteColor];
  _rootViewController = [ExpoKit sharedInstance].rootViewController;
  _window.rootViewController = _rootViewController;

  [_window makeKeyAndVisible];
}

@end
