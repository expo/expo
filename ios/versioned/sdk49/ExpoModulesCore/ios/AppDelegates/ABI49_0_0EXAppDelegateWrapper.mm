// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXAppDelegateWrapper.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXReactDelegateWrapper+Private.h>
#import <ABI49_0_0ExpoModulesCore/Swift.h>


@interface ABI49_0_0EXAppDelegateWrapper()

@property (nonatomic, strong) ABI49_0_0EXReactDelegateWrapper *reactDelegate;

@end

@implementation ABI49_0_0EXAppDelegateWrapper {
  ABI49_0_0EXExpoAppDelegate *_expoAppDelegate;
}

// Synthesize window, so the AppDelegate can synthesize it too.
@synthesize window = _window;

- (instancetype)init
{
  if (self = [super init]) {
    _expoAppDelegate = [[ABI49_0_0EXExpoAppDelegate alloc] init];
    _reactDelegate = [[ABI49_0_0EXReactDelegateWrapper alloc] initWithExpoReactDelegate:_expoAppDelegate.reactDelegate];
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

#if __has_include(<ABI49_0_0React-ABI49_0_0RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>) || __has_include(<ABI49_0_0React_RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>)

- (UIView *)findRootView:(UIApplication *)application
{
  UIWindow *mainWindow = application.delegate.window;
  if (mainWindow == nil) {
    return nil;
  }
  UIViewController *rootViewController = mainWindow.rootViewController;
  if (rootViewController == nil) {
    return nil;
  }
  UIView *rootView = rootViewController.view;
  return rootView;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  UIView *rootView = [self findRootView:application];
  // Backward compatible with react-native 0.71 running with legacy template,
  // i.e. still creating bridge, rootView in AppDelegate.mm.
  // In this case, we don't go through ABI49_0_0RCTAppDelegate's setup.
  if (rootView == nil || ![rootView isKindOfClass:[ABI49_0_0RCTRootView class]]) {
    [super application:application didFinishLaunchingWithOptions:launchOptions];
    [_expoAppDelegate application:application didFinishLaunchingWithOptions:launchOptions];
  }
  return YES;
}

- (ABI49_0_0RCTBridge *)createBridgeWithDelegate:(id<ABI49_0_0RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [self.reactDelegate createBridgeWithDelegate:delegate launchOptions:launchOptions];
}

- (UIView *)createRootViewWithBridge:(ABI49_0_0RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  BOOL enableFabric = NO;
#if RN_FABRIC_ENABLED
  enableFabric = self.fabricEnabled;
#endif

  return [self.reactDelegate createRootViewWithBridge:bridge
                                         moduleName:moduleName
                                    initialProperties:initProps
                                        fabricEnabled:enableFabric];
}

- (UIViewController *)createRootViewController
{
  return [self.reactDelegate createRootViewController];
}
#endif // __has_include(<ABI49_0_0React-ABI49_0_0RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>)

@end
