// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactRootViewFactory.h>

#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTHost+Internal.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

@interface RCTAppDelegate () <RCTTurboModuleManagerDelegate>

@end

@interface RCTRootViewFactory () <RCTContextContainerHandling> {
  RCTHost *_reactHost;
  __weak id<RCTTurboModuleManagerDelegate> _turboModuleManagerDelegate;
}

- (std::shared_ptr<facebook::react::JSRuntimeFactory>)createJSRuntimeFactory;

@property (nonatomic, strong, nullable) RCTHost *reactHost;
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

  // The RCTHost/RCTBridge instance is retained by the RCTRootViewFactory.
  // We will have to replace these instance from the app to the newly created instance.
  if (appDelegate.bridgelessEnabled) {
    appRootViewFactory.reactHost = factory.reactHost;
  } else {
    appRootViewFactory.bridge = factory.bridge;
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

- (RCTHost *)reactHost
{
  return [self valueForKey:@"_reactHost"];
}

- (void)setReactHost:(RCTHost *)reactHost
{
  return [self setValue:reactHost forKey:@"_reactHost"];
}

/**
 Override `createReactHostIfNeeded`:
 - Reuse `RCTAppDelegate.rootViewFactory` for jsEngineProvider and ContextContainerHandler.
   Since we just customize bundleURL, all the other references we could reuse from `RCTAppDelegate.rootViewFactory`.
   That would also prevent `[weakSelf createJSRuntimeFactory]` from unretained self.
 */
- (void)createReactHostIfNeeded
{
  if ([self reactHost]) {
    return;
  }

  RCTAppDelegate *appDelegate = [EXReactRootViewFactory getRCTAppDelegate];
  RCTRootViewFactory *appRootViewFactory = (RCTRootViewFactory *)appDelegate.rootViewFactory;
  __weak RCTRootViewFactory *weakAppRootViewFactory = appRootViewFactory;

  RCTRootViewFactoryConfiguration *configuration = [self valueForKey:@"_configuration"];
  NSURL *bundleURL = configuration.bundleURL;
  id<RCTTurboModuleManagerDelegate> turboModuleManagerDelegate = [self valueForKey:@"_turboModuleManagerDelegate"];

  RCTHost *reactHost = [[RCTHost alloc] initWithBundleURL:bundleURL
                                     hostDelegate:nil
                       turboModuleManagerDelegate:turboModuleManagerDelegate
                                 jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                   return [weakAppRootViewFactory createJSRuntimeFactory];
                                 }];
  [reactHost setBundleURLProvider:^NSURL *() {
    return bundleURL;
  }];
  [reactHost setContextContainerHandler:appRootViewFactory];
  [reactHost start];

  [self setReactHost:reactHost];
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
