// Copyright 2024-present 650 Industries. All rights reserved.

#import <ReactCommon/RCTTurboModule.h>
#import <ExpoModulesCore/ExpoBridgeModule.h>
#import <ExpoModulesCore/EXHBCRuntimeManager.h>
#import "EXHBCRuntimeManager+Singleton.h"
#import <ExpoModulesCore/Swift.h>

// The runtime executor is included as of React Native 0.74 in bridgeless mode.
#if __has_include(<ReactCommon/RCTRuntimeExecutor.h>)
#import <ReactCommon/RCTRuntimeExecutor.h>
#endif // React Native >=0.74

@implementation ExpoBridgeModule

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExpoModulesCore);

- (instancetype)init
{
  if (self = [super init]) {
    _appContext = [[EXAppContext alloc] init];
    NSLog(@"🔥 ExpoBridgeModule: Registering app context %p in init", _appContext);
    [[EXHBCRuntimeManagerSingleton sharedInstance] registerAppContext:_appContext];
  }
  return self;
}

- (instancetype)initWithAppContext:(EXAppContext *) appContext
{
  if (self = [super init]) {
    _appContext = appContext;
    NSLog(@"🔥 ExpoBridgeModule: Registering app context %p in initWithAppContext", _appContext);
    [[EXHBCRuntimeManagerSingleton sharedInstance] registerAppContext:_appContext];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  // We do want to run the initialization (`setBridge`) on the JS thread.
  return NO;
}

- (void)setBridge:(RCTBridge *)bridge
{
  NSLog(@"🔥 ExpoBridgeModule: setBridge called with bridge %p", bridge);
  // As of React Native 0.74 with the New Architecture enabled,
  // it's actually an instance of `RCTBridgeProxy` that provides backwards compatibility.
  // Also, hold on with initializing the runtime until `setRuntimeExecutor` is called.
  _bridge = bridge;
  _appContext.reactBridge = bridge;

#if !__has_include(<ReactCommon/RCTRuntimeExecutor.h>)
  NSLog(@"🔥 ExpoBridgeModule: Setting up runtime for legacy architecture");
  _appContext._runtime = [EXJavaScriptRuntimeManager runtimeFromBridge:bridge];
  // Trigger HBC injection for legacy architecture with a delay to ensure runtime is ready
  dispatch_async(dispatch_get_main_queue(), ^{
    NSLog(@"🚀 ExpoBridgeModule: Triggering delayed HBC injection for legacy architecture");
    [EXHBCRuntimeManagerSingleton triggerHBCInjectionForLegacyArchitecture];
  });
#endif // React Native <0.74
}

#if __has_include(<ReactCommon/RCTRuntimeExecutor.h>)
- (void)setRuntimeExecutor:(RCTRuntimeExecutor *)runtimeExecutor
{
  _appContext._runtime = [EXJavaScriptRuntimeManager runtimeFromBridge:_bridge withExecutor:runtimeExecutor];
  // Trigger HBC injection for legacy architecture or bridgeless without proper RCTHost setup with a delay
  dispatch_async(dispatch_get_main_queue(), ^{
    [EXHBCRuntimeManagerSingleton triggerHBCInjectionForLegacyArchitecture];
  });
}
#endif // React Native >=0.74

/**
 This should be called inside `[EXNativeModulesProxy setBridge:]`.
 */
- (void)legacyProxyDidSetBridge:(nonnull EXNativeModulesProxy *)moduleProxy
           legacyModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry
{
  _appContext.legacyModulesProxy = moduleProxy;
  _appContext.legacyModuleRegistry = moduleRegistry;

  // We need to register all the modules after the legacy module registry is set
  // otherwise legacy modules (e.g. permissions) won't be available in OnCreate { }
  [_appContext useModulesProvider:@"ExpoModulesProvider"];
}

/**
 A synchronous method that is called from JS before requiring
 any module to ensure that all necessary bindings are installed.
 */
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(installModules)
{
  if (_bridge && !_appContext._runtime) {
    // TODO: Keep this condition until we remove the other way of installing modules.
    // See `setBridge` method above.
    _appContext._runtime = [EXJavaScriptRuntimeManager runtimeFromBridge:_bridge];
    // Trigger HBC injection for fallback runtime setup with a delay
    dispatch_async(dispatch_get_main_queue(), ^{
      [EXHBCRuntimeManagerSingleton triggerHBCInjectionForLegacyArchitecture];
    });
  }
  return nil;
}

@end
