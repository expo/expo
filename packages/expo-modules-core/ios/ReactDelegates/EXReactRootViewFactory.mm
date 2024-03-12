// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactRootViewFactory.h>

#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

@interface RCTAppDelegate () <RCTTurboModuleManagerDelegate>

@end

@implementation EXReactRootViewFactory

- (instancetype)initWithReactDelegate:(nullable EXReactDelegateWrapper *)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
{
  if (self = [super initWithConfiguration:configuration andTurboModuleManagerDelegate:turboModuleManagerDelegate]) {
    self.reactDelegate = reactDelegate;
  }
  return self;
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties
                 launchOptions:(nullable NSDictionary *)launchOptions
{
  if (self.reactDelegate != nil) {
    return [self.reactDelegate createReactRootView:moduleName initialProperties:initialProperties launchOptions:launchOptions];
  }
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
}

+ (UIView *)createDefaultReactRootView:(nullable NSURL *)_bundleURL
                            moduleName:(nullable NSString *)_moduleName
                     initialProperties:(nullable NSDictionary *)_initialProperties
                         launchOptions:(nullable NSDictionary *)launchOptions
{
  RCTAppDelegate *appDelegate = [self getRCTAppDelegate];
  NSURL *bundleURL = _bundleURL;
  if (bundleURL == nil) {
    bundleURL = appDelegate.bundleURL;
  }
  NSString *moduleName = _moduleName;
  if (moduleName == nil) {
    moduleName = appDelegate.moduleName;
  }
  NSDictionary *initialProperties = _initialProperties;
  if (initialProperties == nil) {
    initialProperties = appDelegate.initialProps;
  }
  RCTRootViewFactoryConfiguration *configuration =
  [[RCTRootViewFactoryConfiguration alloc] initWithBundleURL:bundleURL
                                              newArchEnabled:appDelegate.fabricEnabled
                                          turboModuleEnabled:appDelegate.turboModuleEnabled
                                           bridgelessEnabled:appDelegate.bridgelessEnabled];

  __weak RCTAppDelegate *weakDelegate = appDelegate;
  configuration.createRootViewWithBridge = ^UIView *(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps)
  {
    return [weakDelegate createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  };

  configuration.createBridgeWithDelegate = ^RCTBridge *(id<RCTBridgeDelegate> delegate, NSDictionary *launchOptions)
  {
    return [weakDelegate createBridgeWithDelegate:delegate launchOptions:launchOptions];
  };

  RCTRootViewFactory *factory = [[RCTRootViewFactory alloc] initWithConfiguration:configuration andTurboModuleManagerDelegate:appDelegate];
  return [factory viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
}

+ (RCTAppDelegate *)getRCTAppDelegate
{
  UIApplication *application = UIApplication.sharedApplication;
  id delegate = application.delegate;
  if (![delegate isKindOfClass:RCTAppDelegate.class]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"The UIApplicationDelegate is a RCTAppDelegate."
                                 userInfo:nil];
  }
  return (RCTAppDelegate *)delegate;
}

@end
