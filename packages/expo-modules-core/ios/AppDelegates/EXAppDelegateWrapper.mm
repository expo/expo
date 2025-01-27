// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppDelegateWrapper.h>
#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ExpoModulesCore/EXReactRootViewFactory.h>
#import <ExpoModulesCore/Swift.h>
#import <ExpoModulesCore/RCTAppDelegateUmbrella.h>

#import <React/RCTComponentViewFactory.h> // Allows non-umbrella since it's coming from React-RCTFabric
#import <ReactCommon/RCTHost.h> // Allows non-umbrella because the header is not inside a clang module

// TODO remove the if when 76 is not supported, or rather remove the EXAppDelegateWrapper because it's deprecated
#if __has_include(<ReactAppDependencyProvider/RCTAppDependencyProvider.h>)
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#endif

@interface RCTAppDelegate () <RCTComponentViewFactoryComponentProvider, RCTHostDelegate>
@end

@implementation EXAppDelegateWrapper {
  EXExpoAppDelegate *_expoAppDelegate;
}

- (instancetype)init
{
  if (self = [super init]) {
    // TODO(kudo) to remove the `initWithAppDelegate` initializer when `EXAppDelegateWrapper` is removed
    _expoAppDelegate = [[EXExpoAppDelegate alloc] initWithAppDelegate:self];
    _expoAppDelegate.shouldCallReactNativeSetup = NO;
  }
  return self;
}

// This needs to be implemented, otherwise forwarding won't be called.
// When the app starts, `UIApplication` uses it to check beforehand
// which `UIApplicationDelegate` selectors are implemented.
- (BOOL)respondsToSelector:(SEL)selector
{
  return [super respondsToSelector:selector] || [_expoAppDelegate respondsToSelector:selector];
}

// Forwards all invocations to `ExpoAppDelegate` object.
- (id)forwardingTargetForSelector:(SEL)selector
{
  return _expoAppDelegate;
}

#pragma mark - RCTAppDelegate

// Make sure to override all necessary methods from `RCTAppDelegate` here, explicitly forwarding everything to `_expoAppDelegate`.
// `forwardingTargetForSelector` works only for methods that are not specified in this and `RCTAppDelegate` classes.

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#if __has_include(<ReactAppDependencyProvider/RCTAppDependencyProvider.h>)
	self.dependencyProvider = [RCTAppDependencyProvider new];
#endif
  [super application:application didFinishLaunchingWithOptions:launchOptions];
  return [_expoAppDelegate application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
  return [_expoAppDelegate applicationDidBecomeActive:application];
}

- (UIViewController *)createRootViewController
{
  return [_expoAppDelegate createRootViewController];
}

- (RCTRootViewFactory *)createRCTRootViewFactory
{
  return [_expoAppDelegate createRCTRootViewFactory];
}

- (void)customizeRootView:(UIView *)rootView
{
  [_expoAppDelegate customizeRootView:rootView];
}

#pragma mark - RCTComponentViewFactoryComponentProvider

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
#if __has_include(<ReactAppDependencyProvider/RCTAppDependencyProvider.h>)
	return self.dependencyProvider.thirdPartyFabricComponents;
#endif
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

#pragma mark - Helpers

+ (void)customizeRootView:(nonnull UIView *)rootView byAppDelegate:(nonnull RCTAppDelegate *)appDelegate
{
  [appDelegate customizeRootView:(RCTRootView *)rootView];
}

@end
