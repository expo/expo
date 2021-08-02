#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTDevMenu.h>
#import <React/RCTUtils.h>

#import <UMCore/UMModuleRegistry.h>
#import <UMReactNativeAdapter/UMNativeModulesProxy.h>
#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>
#import <UMCore/UMModuleRegistryProvider.h>

@interface AppDelegate () <RCTBridgeDelegate>

@property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;
@property (nonatomic, strong) NSDictionary *launchOptions;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [self ensureReactMethodSwizzlingSetUp];
  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
  
  self.launchOptions = launchOptions;
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  
  [self initializeReactNativeApp];
  [super application:application didFinishLaunchingWithOptions:launchOptions];

  return YES;
}

// Bring back React method swizzling removed from its Pod
// when integrating with Expo client.
// https://github.com/expo/react-native/commit/7f2912e8005ea6e81c45935241081153b822b988
- (void)ensureReactMethodSwizzlingSetUp
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wundeclared-selector"
    // RCTKeyCommands.m
    // swizzle UIResponder
    RCTSwapInstanceMethods([UIResponder class],
                          @selector(keyCommands),
                          @selector(RCT_keyCommands));

    // RCTDevMenu.m
    // We're swizzling here because it's poor form to override methods in a category,
    // however UIWindow doesn't actually implement motionEnded:withEvent:, so there's
    // no need to call the original implementation.
    RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(RCT_motionEnded:withEvent:));
    #pragma clang diagnostic pop
  });
}

- (RCTBridge *)initializeReactNativeApp
{
  
  NSDictionary *launchOptions = self.launchOptions;
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
  NSMutableArray<id<RCTBridgeModule>> *extraModules = [[_moduleRegistryAdapter extraModulesForBridge:bridge] mutableCopy];  
  [extraModules addObject:(id<RCTBridgeModule>)[[RCTDevMenu alloc] init]];
  return extraModules;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
 #ifdef DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
  #endif
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];;
}


// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

@end
