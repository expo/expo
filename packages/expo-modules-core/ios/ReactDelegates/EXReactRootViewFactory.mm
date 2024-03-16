// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactRootViewFactory.h>

#import <objc/runtime.h>
#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

@interface RCTAppDelegate () <RCTTurboModuleManagerDelegate>

@end

@interface RCTSurfaceHostingProxyRootView () {
  RCTHost *_reactHost;
}

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
  NSURL *bundleURL = _bundleURL ?: appDelegate.bundleURL;
  NSString *moduleName = _moduleName ?: appDelegate.moduleName;
  NSDictionary *initialProperties = _initialProperties ?: appDelegate.initialProps;

   if (![appDelegate.rootViewFactory isKindOfClass:EXReactRootViewFactory.class]) {
     @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                    reason:@"The appDelegate.rootViewFactory must be an EXReactRootViewFactory instance."
                                  userInfo:nil];
   }
  EXReactRootViewFactory *appRootViewFactory = (EXReactRootViewFactory *)appDelegate.rootViewFactory;
  RCTRootViewFactoryConfiguration *appRootViewFactoryConfiguration = [appRootViewFactory valueForKey:@"_configuration"];

  RCTRootViewFactoryConfiguration *configuration =
  [[RCTRootViewFactoryConfiguration alloc] initWithBundleURL:bundleURL
                                              newArchEnabled:appDelegate.fabricEnabled
                                          turboModuleEnabled:appDelegate.turboModuleEnabled
                                           bridgelessEnabled:appDelegate.bridgelessEnabled];
  configuration.createRootViewWithBridge = appRootViewFactoryConfiguration.createRootViewWithBridge;
  configuration.createBridgeWithDelegate = appRootViewFactoryConfiguration.createBridgeWithDelegate;

  EXReactRootViewFactory *factory = [[EXReactRootViewFactory alloc] initWithConfiguration:configuration andTurboModuleManagerDelegate:appDelegate];
  UIView *rootView = [factory superViewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];

  // We want to retain RCTHost/RCTBridge instance from the root view.
  // RCTBridge is retained from RCTRootView by nature and RCTHost would be retained using associated objects.
  // We will also release the unused RCTHost/RCTBridge from RCTRootViewFactory.
  if (appDelegate.bridgelessEnabled) {
    RCTHost *rctHost = [factory valueForKey:@"_reactHost"];
    objc_setAssociatedObject(rootView, "_reactHost", rctHost, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    [appRootViewFactory setValue:nil forKey:@"_reactHost"];
  } else {
    appRootViewFactory.bridge = nil;
  }
  return rootView;
}

/**
 Calls origin `viewWithModuleName:initialProperties:launchOptions:` from superview (`RCTRootViewFactory`).
 */
- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions
{
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
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
