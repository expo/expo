#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>

#import <UMCore/UMModuleRegistry.h>
#import <UMReactNativeAdapter/UMNativeModulesProxy.h>
#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>
#import <UMCore/UMModuleRegistryProvider.h>

@import EXDevMenu;
#include <EXDevLauncher/EXDevLauncherController.h>


@interface DevMenuDetoxTestInterceptor : NSObject<DevMenuTestInterceptor>

@end

@implementation DevMenuDetoxTestInterceptor

- (BOOL)isOnboardingFinishedKey
{
  return YES;
}

- (BOOL)shouldShowAtLaunch
{
  return NO;
}

@end

@interface AppDelegate () <RCTBridgeDelegate>

@property (nonatomic, strong) EXModuleRegistryAdapter *moduleRegistryAdapter;
@property (nonatomic, strong) NSDictionary *launchOptions;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [DevMenuTestInterceptorManager setTestInterceptor:[DevMenuDetoxTestInterceptor new]];

  self.moduleRegistryAdapter = [[EXModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[EXModuleRegistryProvider alloc] init]];
  self.launchOptions = launchOptions;
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];

   EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];
   [controller startWithWindow:self.window delegate:(id<EXDevLauncherControllerDelegate>)self launchOptions:launchOptions];

  [super application:application didFinishLaunchingWithOptions:launchOptions];

  return YES;
}

- (RCTBridge *)initializeReactNativeApp
{
  NSDictionary *launchOptions = [EXDevLauncherController.sharedInstance getLaunchOptions];

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return bridge;
 }

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge];
  // If you'd like to export some custom RCTBridgeModules that are not Expo modules, add them here!
  return extraModules;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [[EXDevLauncherController sharedInstance] sourceUrl];
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  if ([EXDevLauncherController.sharedInstance onDeepLink:url options:options]) {
    return true;
  }

  return [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

@end

@implementation AppDelegate (EXDevLauncherControllerDelegate)
 
- (void)devLauncherController:(EXDevLauncherController *)developmentClientController
          didStartWithSuccess:(BOOL)success
{
  developmentClientController.appBridge = [self initializeReactNativeApp];
}
 
@end