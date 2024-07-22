// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppDelegateWrapper.h>
#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ExpoModulesCore/EXReactRootViewFactory.h>
#import <ExpoModulesCore/Swift.h>

#if __has_include(<React-RCTAppDelegate/RCTRootViewFactory.h>)
#import <React-RCTAppDelegate/RCTRootViewFactory.h>
#elif __has_include(<React_RCTAppDelegate/RCTRootViewFactory.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTRootViewFactory.h>
#endif

#import <ReactCommon/RCTTurboModuleManager.h>

@interface RCTAppDelegate () <RCTTurboModuleManagerDelegate>
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

// Synthesize window, so the AppDelegate can synthesize it too.
@synthesize window = _window;

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
                                                       newArchEnabled:self.fabricEnabled
                                                   turboModuleEnabled:self.turboModuleEnabled
                                                    bridgelessEnabled:self.bridgelessEnabled];

  configuration.createRootViewWithBridge = ^UIView *(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps)
  {
    return [weakSelf createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  };

  configuration.createBridgeWithDelegate = ^RCTBridge *(id<RCTBridgeDelegate> delegate, NSDictionary *launchOptions)
  {
    return [weakSelf createBridgeWithDelegate:delegate launchOptions:launchOptions];
  };

  // TODO(kudo,20240706): Remove respondsToSelector and set the property directly when we upgrade to react-native 0.75
  if ([configuration respondsToSelector:@selector(setCustomizeRootView:)]) {
    [configuration setCustomizeRootView:^(UIView *_Nonnull rootView) {
      [weakSelf customizeRootView:(RCTRootView *)rootView];
    }];
  }

  return [[EXReactRootViewFactory alloc] initWithReactDelegate:self.reactDelegate configuration:configuration turboModuleManagerDelegate:self];
}

- (void)customizeRootView:(UIView *)rootView {
  [_expoAppDelegate customizeRootView:rootView];
}

@end
