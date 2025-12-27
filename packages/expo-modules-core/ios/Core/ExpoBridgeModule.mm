// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppContextFactoryRegistry.h>
#import <ExpoModulesCore/EXAppContextProtocol.h>
#import <ExpoModulesCore/EXJSIInstaller.h>
#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesCore/ExpoBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>

@implementation ExpoBridgeModule

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExpoModulesCore);

- (instancetype)init
{
  if (self = [super init]) {
    // Use registry to create AppContext - Swift factory registers itself at
    // load time
    _appContext = (EXAppContext *)[EXAppContextFactoryRegistry createAppContext];
  }
  return self;
}

- (instancetype)initWithAppContext:(EXAppContext *)appContext
{
  if (self = [super init]) {
    _appContext = appContext;
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
  _bridge = bridge;
  [self maybeSetupAppContext];
}

- (void)maybeSetupAppContext
{
  if (!_bridge) {
    return;
  }
  EXRuntime *runtime = [EXJavaScriptRuntimeManager runtimeFromBridge:_bridge];

  // Cast to protocol to access properties without importing Swift.h
  id<EXAppContextProtocol> ctx = (id<EXAppContextProtocol>)_appContext;

  // If `global.expo` is defined, the app context has already been initialized
  // from `ExpoReactNativeFactory`. The factory was introduced in SDK 55 and
  // requires migration in bare workflow projects. We keep this as an
  // alternative way during the transitional period.
  if (runtime && ![[runtime global] hasProperty:@"expo"]) {
    NSLog(@"Expo is being initialized from the deprecated ExpoBridgeModule, make sure to migrate to ExpoReactNativeFactory in your project");

    // Set reactBridge directly on _appContext since it's not part of the
    // protocol (reactBridge is internal to expo-modules-core). Cast to id to
    // avoid forward declaration issue.
    [(id)_appContext setValue:_bridge forKey:@"reactBridge"];
    ctx._runtime = runtime;
    [ctx registerNativeModules];
  }
}

/**
 This should be called inside `[EXNativeModulesProxy setBridge:]`.
 */
- (void)legacyProxyDidSetBridge:(nonnull EXNativeModulesProxy *)moduleProxy
           legacyModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry
{
  // Cast to protocol to access properties without importing Swift.h
  id<EXAppContextProtocol> ctx = (id<EXAppContextProtocol>)_appContext;
  ctx.legacyModulesProxy = moduleProxy;
  ctx.legacyModuleRegistry = moduleRegistry;
}

/**
 A synchronous method that is called from JS before requiring
 any module to ensure that all necessary bindings are installed.
 */
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(installModules)
{
  // Cast to protocol to access properties without importing Swift.h
  id<EXAppContextProtocol> ctx = (id<EXAppContextProtocol>)_appContext;
  if (_bridge && !ctx._runtime) {
    // If `setBridge:` was called but the runtime was not found, we try again
    // here.
    [self maybeSetupAppContext];
  }
  return nil;
}

@end
