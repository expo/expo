// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXAppDelegateWrapper.h>

#import <ExpoModulesCore/EXReactRootViewFactory.h>
#import <ExpoModulesCore/RCTAppDelegateUmbrella.h>
#import <Expo/Swift.h>

#import <React/RCTComponentViewFactory.h> // Allows non-umbrella since it's coming from React-RCTFabric
#import <ReactCommon/RCTHost.h> // Allows non-umbrella because the header is not inside a clang module

@implementation EXAppDelegateWrapper {
  EXExpoAppDelegate *_expoAppDelegate;
}

- (instancetype)init
{
  if (self = [super init]) {
    // TODO(kudo) to remove the `initWithAppDelegate` initializer when `EXAppDelegateWrapper` is removed
    _expoAppDelegate = [[EXExpoAppDelegate alloc] initWithFactoryDelegate:self];
  }
  return self;
}

- (void)setModuleName:(NSString * _Nullable)moduleName {
  _expoAppDelegate.moduleName = [moduleName copy];
}

- (NSString*) moduleName {
  return _expoAppDelegate.moduleName;
}

- (void)setInitialProps:(NSDictionary * _Nullable)initialProps {
  _expoAppDelegate.initialProps = initialProps;
}

- (NSDictionary*) initialProps {
  return _expoAppDelegate.initialProps;
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

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
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

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return [_expoAppDelegate getModuleInstanceFromClass:moduleClass];
}

- (Class)getModuleClassFromName:(const char *)name {
  return [_expoAppDelegate getModuleClassFromName:name];
}


#pragma mark - Helpers

+ (void)customizeRootView:(nonnull UIView *)rootView byAppDelegate:(nonnull RCTAppDelegate *)appDelegate
{
  [appDelegate customizeRootView:(RCTRootView *)rootView];
}

@end
