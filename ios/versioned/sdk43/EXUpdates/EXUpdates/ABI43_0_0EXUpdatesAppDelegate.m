// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppDelegate.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppDelegateWrapper.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDefines.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesConfig.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppController.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridgeDelegate.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTRootView.h>

@interface ABI43_0_0EXUpdatesBridgeDelegateInterceptor : NSObject<ABI43_0_0RCTBridgeDelegate>

@property (nonatomic, weak) id<ABI43_0_0RCTBridgeDelegate> bridgeDelegate;

- (nonnull instancetype)initWithBridgeDelegate:(id<ABI43_0_0RCTBridgeDelegate>)bridgeDelegate;

@end

@interface ABI43_0_0EXUpdatesAppDelegate() <ABI43_0_0EXUpdatesAppControllerDelegate>

@property (nonatomic, strong) NSDictionary *launchOptions;

@end

@implementation ABI43_0_0EXUpdatesAppDelegate

#if !defined(DEBUG)

ABI43_0_0EX_REGISTER_SINGLETON_MODULE(ABI43_0_0EXUpdatesAppDelegate)

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
  ABI43_0_0EXUpdatesAppController *controller = [ABI43_0_0EXUpdatesAppController sharedInstance];
  if (controller.isStarted) {
    // backward compatible if main AppDelegate already has expo-updates setup,
    // we just skip in this case.
    return NO;
  }
  self.launchOptions = launchOptions;
  controller.delegate = self;
  [controller startAndShowLaunchScreen:application.delegate.window];
  return YES;
}

#pragma mark - ABI43_0_0EXUpdatesAppControllerDelegate

- (void)appController:(ABI43_0_0EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success
{
  appController.bridge = [self initializeReactNativeApp];
}

#pragma mark - Internals

- (BOOL)shouldEnableAutoSetup
{
  // if Expo.plist not found or its content is invalid, disable the auto setup
  NSString *configPath = [[NSBundle mainBundle] pathForResource:ABI43_0_0EXUpdatesConfigPlistName ofType:@"plist"];
  if (!configPath) {
    return NO;
  }
  NSDictionary *config = [NSDictionary dictionaryWithContentsOfFile:configPath];
  if (!config) {
    return NO;
  }

  // if `ABI43_0_0EXUpdatesAutoSetup` is false, disable the auto setup
  id enableAutoSetupValue = config[ABI43_0_0EXUpdatesConfigEnableAutoSetupKey];
  if (enableAutoSetupValue &&
      [enableAutoSetupValue isKindOfClass:[NSNumber class]] &&
      [enableAutoSetupValue boolValue] == false) {
    return NO;
  }

  return YES;
}

- (ABI43_0_0RCTBridge *)initializeReactNativeApp
{
  if (![UIApplication.sharedApplication.delegate conformsToProtocol:@protocol(ABI43_0_0RCTBridgeDelegate)]) {
    [NSException raise:NSInvalidArgumentException format:@"AppDelegate does not conforms to ABI43_0_0RCTBridgeDelegate"];
  }
  ABI43_0_0EXUpdatesBridgeDelegateInterceptor* bridgeDelegate = [[ABI43_0_0EXUpdatesBridgeDelegateInterceptor alloc]
                                                        initWithBridgeDelegate:(id<ABI43_0_0RCTBridgeDelegate>)UIApplication.sharedApplication.delegate];

  ABI43_0_0RCTBridge *bridge = [[ABI43_0_0RCTBridge alloc] initWithDelegate:bridgeDelegate launchOptions:self.launchOptions];
  ABI43_0_0RCTRootView *rootView = [[ABI43_0_0RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  id rootViewBackgroundColor = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"ABI43_0_0RCTRootViewBackgroundColor"];
  if (rootViewBackgroundColor != nil) {
    rootView.backgroundColor = [ABI43_0_0RCTConvert UIColor:rootViewBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  UIWindow *window = UIApplication.sharedApplication.delegate.window;
  window.rootViewController = rootViewController;
  [window makeKeyAndVisible];

  return bridge;
 }

@end

@implementation ABI43_0_0EXUpdatesBridgeDelegateInterceptor

- (nonnull instancetype)initWithBridgeDelegate:(id<ABI43_0_0RCTBridgeDelegate>)bridgeDelegate
{
  if (self = [super init]) {
    self.bridgeDelegate = bridgeDelegate;
  }
  return self;
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

- (NSURL *)sourceURLForBridge:(ABI43_0_0RCTBridge *)bridge
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.launchAssetUrl;
}

@end
