// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXAppDelegateWrapper.h>

#import <Expo/RCTAppDelegateUmbrella.h>
#import <Expo/Swift.h>

#import <React/RCTComponentViewFactory.h> // Allows non-umbrella since it's coming from React-RCTFabric
#import <ReactCommon/RCTHost.h> // Allows non-umbrella because the header is not inside a clang module

@implementation EXAppDelegateWrapper {
  EXExpoAppDelegate *_expoAppDelegate;
}

- (instancetype)init
{
  if (self = [super init]) {
    _expoAppDelegate = [EXExpoAppDelegate new];
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

#pragma mark - UIApplicationDelegate

// Make sure to override all necessary methods from `RCTAppDelegate` here, explicitly forwarding everything to `_expoAppDelegate`.
// `forwardingTargetForSelector` works only for methods that are not specified in this and `RCTAppDelegate` classes.

#if !TARGET_OS_OSX
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  return [_expoAppDelegate application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
  return [_expoAppDelegate applicationDidBecomeActive:application];
}
#else
- (void)applicationDidFinishLaunching:(NSNotification *)notification
{ 
  return [_expoAppDelegate applicationDidFinishLaunching:notification];
}

- (void)applicationDidBecomeActive:(NSNotification *)notification
{
  return [_expoAppDelegate applicationDidBecomeActive:notification];
}
#endif

- (UIViewController *)createRootViewController
{
  return [_expoAppDelegate.factory.delegate createRootViewController];
}

- (void)customizeRootView:(UIView *)rootView
{
  [_expoAppDelegate.factory.delegate customizeRootView:rootView];
}

#pragma mark - RCTComponentViewFactoryComponentProvider

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  return self.dependencyProvider.thirdPartyFabricComponents;
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

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return [_expoAppDelegate.factory.delegate getModuleInstanceFromClass:moduleClass];
}

- (Class)getModuleClassFromName:(const char *)name {
  return [_expoAppDelegate.factory.delegate getModuleClassFromName:name];
}


#pragma mark - Helpers

+ (void)customizeRootView:(nonnull UIView *)rootView byAppDelegate:(nonnull RCTAppDelegate *)appDelegate
{
  [appDelegate customizeRootView:(RCTRootView *)rootView];
}

@end
