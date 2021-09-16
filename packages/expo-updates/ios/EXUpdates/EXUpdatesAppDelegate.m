// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppDelegate.h>

#import <ExpoModulesCore/EXAppDefines.h>
#import <ExpoModulesCore/EXAppDelegateWrapper.h>
#import <ExpoModulesCore/EXDefines.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesAppController.h>
#import <React/RCTBridgeDelegate.h>
#import <React/RCTConvert.h>
#import <React/RCTRootView.h>

@interface EXUpdatesBridgeDelegateInterceptor : NSObject<RCTBridgeDelegate>

@property (nonatomic, weak) id<RCTBridgeDelegate> bridgeDelegate;

- (nonnull instancetype)initWithBridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate;

@end

@interface EXUpdatesAppDelegate() <EXUpdatesAppControllerDelegate>

@property (nonatomic, strong) NSDictionary *launchOptions;

@end

@implementation EXUpdatesAppDelegate

EX_REGISTER_SINGLETON_MODULE(EXUpdatesAppDelegate)

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
  self.launchOptions = launchOptions;
  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
  controller.delegate = self;
  [controller startAndShowLaunchScreen:application.delegate.window];
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
  // backward compatible if main AppDelegate already has expo-updates setup,
  // we just skip in this case.
  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
  if (controller.isStarted) {
    return NO;
  }

  // if app is development build
  if (EXAppDefines.APP_RCT_DEV) {
    return NO;
  }

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
  EXUpdatesBridgeDelegateInterceptor* bridgeDelegate = [[EXUpdatesBridgeDelegateInterceptor alloc]
                                                        initWithBridgeDelegate:(id<RCTBridgeDelegate>)UIApplication.sharedApplication.delegate];

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:bridgeDelegate launchOptions:self.launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  id rootViewBackgroundColor = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTRootViewBackgroundColor"];
  if (rootViewBackgroundColor != nil) {
    rootView.backgroundColor = [RCTConvert UIColor:rootViewBackgroundColor];
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

@implementation EXUpdatesBridgeDelegateInterceptor

- (nonnull instancetype)initWithBridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate
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

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return EXUpdatesAppController.sharedInstance.launchAssetUrl;
}

@end
