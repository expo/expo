// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppDelegateWrapper.h>
#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ExpoModulesCore/EXReactRootViewFactory.h>
#import <ExpoModulesCore/Swift.h>
#import <ExpoModulesCore/RCTAppDelegateUmbrella.h>

#import <React/RCTComponentViewFactory.h> // Allows non-umbrella since it's coming from React-RCTFabric
#import <ReactCommon/RCTHost.h> // Allows non-umbrella because the header is not inside a clang module


@interface RCTAppDelegate () <RCTComponentViewFactoryComponentProvider, RCTHostDelegate>
@end

@interface RCTRootViewFactoryConfiguration ()

- (void)setCustomizeRootView:(void (^)(UIView *rootView))customizeRootView;

@end

@interface EXAppDelegateWrapper()

@property (nonatomic, strong) EXReactDelegateWrapper *reactDelegate;

@end

@implementation EXAppDelegateWrapper {
  EXExpoAppDelegate *_expoAppDelegate;
}

- (instancetype)init
{
  if (self = [super init]) {
    _expoAppDelegate = [[EXExpoAppDelegate alloc] init];
    _reactDelegate = [[EXReactDelegateWrapper alloc] initWithExpoReactDelegate:_expoAppDelegate.reactDelegate];
  }
  return self;
}

// This needs to be implemented, otherwise forwarding won't be called.
// When the app starts, `UIApplication` uses it to check beforehand
// which `UIApplicationDelegate` selectors are implemented.
- (BOOL)respondsToSelector:(SEL)selector
{
  return [super respondsToSelector:selector]
    || [_expoAppDelegate respondsToSelector:selector];
}

// Forwards all invocations to `ExpoAppDelegate` object.
- (id)forwardingTargetForSelector:(SEL)selector
{
  return _expoAppDelegate;
}

#if !TARGET_OS_OSX
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [super application:application didFinishLaunchingWithOptions:launchOptions];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-result"
  [_expoAppDelegate application:application didFinishLaunchingWithOptions:launchOptions];
#pragma clang diagnostic pop
  return YES;
}
#endif // !TARGET_OS_OSX

- (UIViewController *)createRootViewController
{
  return [self.reactDelegate createRootViewController];
}

- (RCTRootViewFactory *)createRCTRootViewFactory
{
  __weak __typeof(self) weakSelf = self;
  RCTBundleURLBlock bundleUrlBlock = ^{
    RCTAppDelegate *strongSelf = weakSelf;
    return strongSelf.bundleURL;
  };

  RCTRootViewFactoryConfiguration *configuration =
      [[RCTRootViewFactoryConfiguration alloc] initWithBundleURLBlock:bundleUrlBlock
                                                       newArchEnabled:self.newArchEnabled
                                                   turboModuleEnabled:self.newArchEnabled
                                                    bridgelessEnabled:self.newArchEnabled];

  configuration.createRootViewWithBridge = ^UIView *(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps)
  {
    return [weakSelf createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  };

  configuration.createBridgeWithDelegate = ^RCTBridge *(id<RCTBridgeDelegate> delegate, NSDictionary *launchOptions)
  {
    return [weakSelf createBridgeWithDelegate:delegate launchOptions:launchOptions];
  };

  configuration.customizeRootView = ^(UIView *_Nonnull rootView) {
    [weakSelf customizeRootView:(RCTRootView *)rootView];
  };

  // NOTE(kudo): `sourceURLForBridge` is not referenced intentionally because it does not support New Architecture.
  configuration.sourceURLForBridge = nil;

  if ([self respondsToSelector:@selector(extraModulesForBridge:)]) {
    configuration.extraModulesForBridge = ^NSArray<id<RCTBridgeModule>> *_Nonnull(RCTBridge *_Nonnull bridge)
    {
      return [weakSelf extraModulesForBridge:bridge];
    };
  }

  if ([self respondsToSelector:@selector(extraLazyModuleClassesForBridge:)]) {
    configuration.extraLazyModuleClassesForBridge =
        ^NSDictionary<NSString *, Class> *_Nonnull(RCTBridge *_Nonnull bridge)
    {
      return [weakSelf extraLazyModuleClassesForBridge:bridge];
    };
  }

  if ([self respondsToSelector:@selector(bridge:didNotFindModule:)]) {
    configuration.bridgeDidNotFindModule = ^BOOL(RCTBridge *_Nonnull bridge, NSString *_Nonnull moduleName) {
      return [weakSelf bridge:bridge didNotFindModule:moduleName];
    };
  }

  return [[EXReactRootViewFactory alloc] initWithReactDelegate:self.reactDelegate configuration:configuration turboModuleManagerDelegate:self];
}

#if !TARGET_OS_OSX
- (void)customizeRootView:(UIView *)rootView {
  [_expoAppDelegate customizeRootView:rootView];
}
#endif // !TARGET_OS_OSX

#pragma mark - RCTComponentViewFactoryComponentProvider

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  return @{};
}

#pragma mark - RCTHostDelegate

- (void)hostDidStart:(RCTHost *)host
{
}

- (void)host:(RCTHost *)host
    didReceiveJSErrorStack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                   message:(NSString *)message
               exceptionId:(NSUInteger)exceptionId
                   isFatal:(BOOL)isFatal
{
}

@end
