// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppDelegate.h>

#import <ExpoModulesCore/EXAppDelegateWrapper.h>
#import <ExpoModulesCore/EXDefines.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesUtils.h>
#import <React/RCTBridgeDelegate.h>
#import <React/RCTConvert.h>
#import <React/RCTRootView.h>

@interface EXUpdatesBridgeDelegateInterceptor : NSObject<RCTBridgeDelegate>

@property (nonatomic, weak) id<RCTBridgeDelegate> bridgeDelegate;

- (nonnull instancetype)initWithBridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate;

@end

@interface EXUpdatesAppDelegate() <EXUpdatesAppControllerDelegate>

@property (nonatomic, strong) NSDictionary *launchOptions;
@property (nonatomic, strong) EXUpdatesBridgeDelegateInterceptor *bridgeDelegate;

@end

@implementation EXUpdatesAppDelegate

#if !defined(DEBUG)

EX_REGISTER_SINGLETON_MODULE(EXUpdatesAppDelegate)

#endif

- (const NSInteger)priority
{
  // default expo-modules priority is 0, we setup expo-updates' priority to 10
  // and make sure `didFinishLaunchingWithOptions` runs before other expo-modules
  return 10;
}

#pragma mark - UIApplicationDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  if (![self shouldEnableAutoSetup]) {
    return NO;
  }
  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
  if (controller.isStarted) {
    // backward compatible if main AppDelegate already has expo-updates setup,
    // we just skip in this case.
    return NO;
  }
  UIWindow *window = application.delegate.window;
  if ([window.rootViewController.view isKindOfClass:[RCTRootView class]]) {
    RCTRootView *rootView = (RCTRootView *)window.rootViewController.view;
    [rootView.bridge invalidate];
  }
  self.launchOptions = launchOptions;
  controller.delegate = self;
  [controller startAndShowLaunchScreen:window];
  return YES;
}

#pragma mark - EXUpdatesAppControllerDelegate

- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success
{
  appController.bridge = [self initializeReactNativeApp];
}

#pragma mark - Internals

- (BOOL)shouldEnableAutoSetup
{
  // if Expo.plist not found or its content is invalid, disable the auto setup
  NSString *configPath = [[NSBundle mainBundle] pathForResource:EXUpdatesConfigPlistName ofType:@"plist"];
  if (!configPath) {
    return NO;
  }
  NSDictionary *config = [NSDictionary dictionaryWithContentsOfFile:configPath];
  if (!config) {
    return NO;
  }

  // if `EXUpdatesAutoSetup` is false, disable the auto setup
  id enableAutoSetupValue = config[EXUpdatesConfigEnableAutoSetupKey];
  if (enableAutoSetupValue &&
      [enableAutoSetupValue isKindOfClass:[NSNumber class]] &&
      [enableAutoSetupValue boolValue] == false) {
    return NO;
  }

  return YES;
}

- (RCTBridge *)initializeReactNativeApp
{
  if (![UIApplication.sharedApplication.delegate conformsToProtocol:@protocol(RCTBridgeDelegate)]) {
    [NSException raise:NSInvalidArgumentException format:@"AppDelegate does not conforms to RCTBridgeDelegate"];
  }
  self.bridgeDelegate = [[EXUpdatesBridgeDelegateInterceptor alloc]
                         initWithBridgeDelegate:(id<RCTBridgeDelegate>)UIApplication.sharedApplication.delegate];

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self.bridgeDelegate launchOptions:self.launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  id rootViewBackgroundColor = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTRootViewBackgroundColor"];
  if (rootViewBackgroundColor != nil) {
    rootView.backgroundColor = [RCTConvert UIColor:rootViewBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  UIWindow *window = UIApplication.sharedApplication.delegate.window;
  UIViewController *rootViewController = [EXUpdatesUtils createRootViewController:window];
  rootViewController.view = rootView;
  window.rootViewController = rootViewController;
  [window makeKeyAndVisible];

  return bridge;
 }

@end

@implementation EXUpdatesBridgeDelegateInterceptor

- (nonnull instancetype)initWithBridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate
{
  if (self = [super init]) {
    self.bridgeDelegate = bridgeDelegate;
  }
  return self;
}

- (BOOL)conformsToProtocol:(Protocol *)protocol
{
  return [self.bridgeDelegate conformsToProtocol:protocol];
}

- (id)forwardingTargetForSelector:(SEL)selector {
  if ([self isInterceptedSelector:selector]) {
    return self;
  }
  return self.bridgeDelegate;
}

- (BOOL)respondsToSelector:(SEL)selector {
  if ([self isInterceptedSelector:selector]) {
    return YES;
  }
  return [self.bridgeDelegate respondsToSelector:selector];
}

- (BOOL)isInterceptedSelector:(SEL)selector {
  if (selector == @selector(sourceURLForBridge:)) {
    return YES;
  }
  return NO;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return EXUpdatesAppController.sharedInstance.launchAssetUrl;
}

@end
