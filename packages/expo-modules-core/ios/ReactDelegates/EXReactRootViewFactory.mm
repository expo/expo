// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactRootViewFactory.h>

#if REACT_NATIVE_TARGET_VERSION >= 74

#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ExpoModulesCore/EXReactHostWrapper+Private.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTHost+Internal.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#if __has_include(<React-RCTAppDelegate/RCTAppSetupUtils.h>)
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppSetupUtils.h>
#endif

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

static NSDictionary *updateInitialProps(NSDictionary *initialProps, BOOL isFabricEnabled)
{
  NSMutableDictionary *mutableProps = initialProps != NULL ? [initialProps mutableCopy] : [NSMutableDictionary new];
  // Hardcoding the Concurrent Root as it it not recommended to
  // have the concurrentRoot turned off when Fabric is enabled.
  mutableProps[kRNConcurrentRoot] = @(isFabricEnabled);
  return mutableProps;
}

@interface RCTRootViewFactory () <RCTBridgeDelegate, RCTContextContainerHandling>

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions;
- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps;
- (std::shared_ptr<facebook::react::JSRuntimeFactory>)createJSRuntimeFactory;
- (void)createBridgeIfNeeded:(NSDictionary *)launchOptions;
- (void)createBridgeAdapterIfNeeded;

@end

@interface RCTAppDelegate () <RCTTurboModuleManagerDelegate>
@end

@implementation EXReactRootViewFactory {
  __weak id<RCTTurboModuleManagerDelegate> _turboModuleManagerDelegate;
}

- (instancetype)initWithReactDelegateWrapper:(nullable EXReactDelegateWrapper *)reactDelegate
                              configuration:(RCTRootViewFactoryConfiguration *)configuration
                 turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
{
  if (self = [super initWithConfiguration:configuration andTurboModuleManagerDelegate:turboModuleManagerDelegate]) {
    self.reactDelegate = reactDelegate;
    self->_turboModuleManagerDelegate = turboModuleManagerDelegate;
  }
  return self;
}

- (instancetype)initWithRCTAppDelegate:(nullable RCTAppDelegate *)appDelegate
                             bundleURL:(nullable NSURL *)_bundleURL
{
  RCTAppDelegate *delegate = appDelegate;
  if (delegate == nil) {
    delegate = [EXReactRootViewFactory getRCTAppDelegate];
  }
  NSURL *bundleURL = _bundleURL;
  if (bundleURL == nil) {
    bundleURL = delegate.bundleURL;
  }
  RCTRootViewFactoryConfiguration *configuration =
  [[RCTRootViewFactoryConfiguration alloc] initWithBundleURL:bundleURL
                                              newArchEnabled:delegate.fabricEnabled
                                          turboModuleEnabled:delegate.turboModuleEnabled
                                           bridgelessEnabled:delegate.bridgelessEnabled];

  __weak RCTAppDelegate *weakDelegate = delegate;
  configuration.createRootViewWithBridge = ^UIView *(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps)
  {
    return [weakDelegate createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  };

  configuration.createBridgeWithDelegate = ^RCTBridge *(id<RCTBridgeDelegate> delegate, NSDictionary *launchOptions)
  {
    return [weakDelegate createBridgeWithDelegate:delegate launchOptions:launchOptions];
  };
  return [self initWithReactDelegateWrapper:nil configuration:configuration turboModuleManagerDelegate:delegate];
}

- (UIView *_Nonnull)viewWithModuleName:(nullable NSString *)_moduleName
                     initialProperties:(nullable NSDictionary *)initialProperties
                         launchOptions:(nullable NSDictionary *)launchOptions
{
  NSString *moduleName = _moduleName;
  if (moduleName == nil) {
    moduleName = [EXReactRootViewFactory getRCTAppDelegate].moduleName;
  }

  // TODO: Remove this after we adding hook to createSurfaceWithModuleName
  RCTRootViewFactoryConfiguration *configuration = [self configuration];

  NSDictionary *initProps = updateInitialProps(initialProperties, configuration.fabricEnabled);

  if (configuration.bridgelessEnabled) {
    // Enable native view config interop only if both bridgeless mode and Fabric is enabled.
    RCTSetUseNativeViewConfigsInBridgelessMode(configuration.fabricEnabled);

    // Enable TurboModule interop by default in Bridgeless mode
    RCTEnableTurboModuleInterop(YES);
    RCTEnableTurboModuleInteropBridgeProxy(YES);

    RCTHost *reactHost = [self createReactHost];
    [self setValue:reactHost forKey:@"_reactHost"];
    return [self createSurfaceViewWithReactHost:reactHost moduleName:moduleName initProps:initProps];
  }

  [self createBridgeIfNeeded:launchOptions];
  [self createBridgeAdapterIfNeeded];

  if (configuration.createRootViewWithBridge != nil) {
    return configuration.createRootViewWithBridge(self.bridge, moduleName, initProps);
  }

  return [self createRootViewWithBridge:self.bridge moduleName:moduleName initProps:initProps];
}

+ (UIView *)createRootView:(EXReactHostWrapper *)host
                moduleName:(NSString *)moduleName
         initialProperties:(nullable NSDictionary *)initialProperties
{
  EXReactRootViewFactory *factory = [[EXReactRootViewFactory alloc] initWithRCTAppDelegate:nil bundleURL:nil];

  if ([factory configuration].bridgelessEnabled) {
    [factory setValue:(RCTHost *)[host get] forKey:@"_reactHost"];
  } else {
    factory.bridge = (RCTBridge *)[host get];
  }
  return [factory viewWithModuleName:moduleName initialProperties:initialProperties];
}

+ (EXReactHostWrapper *)createReactHostWithBundleURL:(nullable NSURL *)bundleURL
                                       launchOptions:(nullable NSDictionary *)launchOptions
{
  EXReactRootViewFactory *factory = [[EXReactRootViewFactory alloc] initWithRCTAppDelegate:nil bundleURL:nil];
  if ([factory configuration].bridgelessEnabled) {
    RCTHost *reactHost = [factory createReactHost];
    return [[EXReactHostWrapper alloc] initWithRCTHost:reactHost];
  }
  // TODO(kudo): clarify whether to use RCTBridgeDelegate from factory or appDelegate
  // I think it's a regression for 0.74.0-rc.3 in the mean time.
  RCTBridge *bridge = [factory configuration].createBridgeWithDelegate(factory, launchOptions);
  return [[EXReactHostWrapper alloc] initWithRCTBridge:bridge];
}

- (RCTRootViewFactoryConfiguration *)configuration
{
  return (RCTRootViewFactoryConfiguration *)[self valueForKey:@"_configuration"];
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

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  if (self.reactDelegate != nil) {
    return (RCTBridge*)[self.reactDelegate createReactHostWithBundleURL:nil launchOptions:launchOptions];
  } else {
    return [[RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
  }
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  BOOL enableFabric = [self configuration].fabricEnabled;
  UIView *rootView;
  if (self.reactDelegate != nil) {
    rootView = [self.reactDelegate createRootViewWithBridge:bridge
                                                         moduleName:moduleName
                                                  initialProperties:initProps];
  } else {
    rootView = RCTAppSetupDefaultRootView(bridge, moduleName, initProps, enableFabric);
  }

#if TARGET_OS_IOS
  rootView.backgroundColor = UIColor.systemBackgroundColor;
#elif TARGET_OS_OSX
  rootView.wantsLayer = YES;
  rootView.layer.backgroundColor = NSColor.windowBackgroundColor.CGColor;
#endif

  return rootView;
}

- (RCTHost *)createReactHost
{
  NSURL *bundleURL = [self configuration].bundleURL;

  if (self.reactDelegate != nil) {
    return (RCTHost *)[[self.reactDelegate createReactHostWithBundleURL:bundleURL launchOptions:nil] get];
  }

  __weak __typeof(self) weakSelf = self;
  RCTHost *reactHost = [[RCTHost alloc] initWithBundleURL:bundleURL
                                             hostDelegate:nil
                               turboModuleManagerDelegate:_turboModuleManagerDelegate
                                         jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                           return [weakSelf createJSRuntimeFactory];
                                         }];
  [reactHost setBundleURLProvider:^NSURL *() {
    return bundleURL;
  }];
  [reactHost setContextContainerHandler:self];
  [reactHost start];
  return reactHost;
}

- (UIView *)createSurfaceViewWithReactHost:(RCTHost *)reactHost
                                moduleName:(NSString *)moduleName
                                 initProps:(NSDictionary *)initProps
{
  if (self.reactDelegate != nil) {
    return [self.reactDelegate createSurfaceViewWithReactHost:reactHost moduleName:moduleName initialProperties:initProps];
  }

  RCTFabricSurface *surface = [reactHost createSurfaceWithModuleName:moduleName initialProperties:initProps];

  RCTSurfaceHostingProxyRootView *surfaceHostingProxyRootView = [[RCTSurfaceHostingProxyRootView alloc]
      initWithSurface:surface
      sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];
  return surfaceHostingProxyRootView;
}

@end

#else

#import <objc/runtime.h>
#import <ExpoModulesCore/EXRCTBridgeDelegateInterceptor.h>
#import <ExpoModulesCore/EXReactHostWrapper+Private.h>
#import <React/RCTBridgeDelegate.h>
#import <React/RCTRootView.h>

#if __has_include(<React-RCTAppDelegate/RCTAppSetupUtils.h>)
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppSetupUtils.h>
#endif

#if RCT_NEW_ARCH_ENABLED

#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTHost+Internal.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTContextContainerHandling.h>

@interface RCTAppDelegate () <RCTTurboModuleManagerDelegate, RCTContextContainerHandling>

- (UIView *)createSurfaceViewWithReactHost:(RCTHost *)reactHost
                                moduleName:(NSString *)moduleName
                                 initProps:(NSDictionary *)initProps;
#if REACT_NATIVE_TARGET_VERSION >= 74
- (std::shared_ptr<facebook::react::JSRuntimeFactory>)createJSRuntimeFactory;
#else
- (std::shared_ptr<facebook::react::JSEngineInstance>)createJSEngineInstance;
#endif

@end

#endif

//+ (UIView *)createReactBindingRootView:(nullable NSURL *)bundleURL
//                     initialProperties:(nullable NSDictionary *)initialProperties
//                         launchOptions:(nullable NSDictionary *)launchOptions
//{
//  RCTAppDelegate *appDelegate = [self getRCTAppDelegate];
//
//  BOOL enableTM = NO;
//#if RCT_NEW_ARCH_ENABLED
//  enableTM = appDelegate.turboModuleEnabled;
//#endif
//
//  RCTAppSetupPrepareApp(UIApplication.sharedApplication, enableTM);
//
//  EXReactHostWrapper *reactHostWrapper = [self createReactHostWithBundleURL:bundleURL launchOptions:nil];
//
//#if RCT_NEW_ARCH_ENABLED
//  if (appDelegate.bridgelessEnabled) {
//    RCTHost *reactHost = (RCTHost *)[reactHostWrapper get];
//    [appDelegate setValue:reactHost forKey:@"_reactHost"];
//    return [self createRootView:reactHostWrapper moduleName:appDelegate.moduleName initialProperties:initialProperties];
//  }
//#endif
//
//  RCTBridge *bridge = (RCTBridge *)[reactHostWrapper get];
//  appDelegate.bridge = bridge;
//#if RCT_NEW_ARCH_ENABLED
//  appDelegate.bridgeAdapter.bridge = appDelegate.bridge;
//  appDelegate.bridge.surfacePresenter = appDelegate.bridgeAdapter.surfacePresenter;
//#endif
//  return [self createRootView:reactHostWrapper moduleName:appDelegate.moduleName initialProperties:initialProperties];
//}

+ (UIView *)createRootView:(EXReactHostWrapper *)host
                moduleName:(NSString *)moduleName
         initialProperties:(nullable NSDictionary *)initialProperties
{
  BOOL fabricEnabled = NO;
#if RCT_NEW_ARCH_ENABLED
  RCTAppDelegate *appDelegate = [self getRCTAppDelegate];
  fabricEnabled = appDelegate.fabricEnabled;

  if (appDelegate.bridgelessEnabled) {
    RCTHost *reactHost = (RCTHost *)[host get];
    RCTFabricSurface *surface = [reactHost createSurfaceWithModuleName:moduleName initialProperties:initialProperties];
    RCTSurfaceHostingProxyRootView *surfaceHostingProxyRootView = [[RCTSurfaceHostingProxyRootView alloc]
        initWithSurface:surface
        sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];
    return surfaceHostingProxyRootView;
  }
#endif

  return RCTAppSetupDefaultRootView((RCTBridge *) [host get], moduleName, initialProperties, fabricEnabled);
}

+ (EXReactHostWrapper *)createReactHostWithBundleURL:(nullable NSURL *)bundleURL
                                       launchOptions:(nullable NSDictionary *)launchOptions
{
  RCTAppDelegate *appDelegate = [self getRCTAppDelegate];

#if RCT_NEW_ARCH_ENABLED
  if (appDelegate.bridgelessEnabled) {
    if (bundleURL == nil) {
#if REACT_NATIVE_TARGET_VERSION >= 74
      bundleURL = appDelegate.bundleURL;
#else
      bundleURL = [appDelegate getBundleURL];
#endif
    }
    __weak __typeof(RCTAppDelegate *) weakDelegate = appDelegate;
#if REACT_NATIVE_TARGET_VERSION >= 74
    RCTHost *reactHost = [[RCTHost alloc] initWithBundleURL:bundleURL
                                               hostDelegate:nil
                                 turboModuleManagerDelegate:appDelegate
                                           jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                             return [weakDelegate createJSRuntimeFactory];
                                           }];
#else
    RCTHost *reactHost = [[RCTHost alloc] initWithBundleURL:bundleURL
                                               hostDelegate:nil
                                 turboModuleManagerDelegate:appDelegate
                                           jsEngineProvider:^std::shared_ptr<facebook::react::JSEngineInstance>() {
                                             return [weakDelegate createJSEngineInstance];
                                           }];
#endif
    [reactHost setBundleURLProvider:^NSURL *() {
      return bundleURL;
    }];
    [reactHost setContextContainerHandler:appDelegate];
    [reactHost start];
    return [[EXReactHostWrapper alloc] initWithRCTHost:reactHost];
  }
#endif

  if (bundleURL == nil) {
    bundleURL = [appDelegate sourceURLForBridge:appDelegate.bridge];
  }
  id<RCTBridgeDelegate> bridgeDelegate = [[EXBridgeDelegateWithCustomBundleURL alloc] initBridgeDelegate:appDelegate withBundleURL:bundleURL];
  objc_setAssociatedObject(appDelegate, "_bridgeDelegate", bridgeDelegate, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:bridgeDelegate launchOptions:launchOptions];
  return [[EXReactHostWrapper alloc] initWithRCTBridge:bridge];
}

@end

#endif
