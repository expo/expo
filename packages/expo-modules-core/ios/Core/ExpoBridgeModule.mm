// Copyright 2024-present 650 Industries. All rights reserved.

#import <ReactCommon/RCTTurboModule.h>
#import <ExpoModulesCore/ExpoBridgeModule.h>
#import <ExpoModulesCore/Swift.h>

@implementation ExpoBridgeModule

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExpoModulesCore);

- (instancetype)init
{
  if (self = [super init]) {
    _appContext = [[EXAppContext alloc] init];
  }
  return self;
}

- (instancetype)initWithAppContext:(EXAppContext *) appContext
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
//  if (!_bridge) {
//    return;
//  }
//  EXRuntime *runtime = [EXJavaScriptRuntimeManager runtimeFromBridge:_bridge];

  // If `global.expo` is defined, the app context has already been initialized from `ExpoReactNativeFactory`.
  // The factory was introduced in SDK 55 and requires migration in bare workflow projects.
  // We keep this as an alternative way during the transitional period.
//  if (runtime && ![[runtime global] hasProperty:@"expo"]) {
//    NSLog(@"Expo is being initialized from the deprecated ExpoBridgeModule, make sure to migrate to ExpoReactNativeFactory in your project");

//    _appContext.reactBridge = _bridge;
//    _appContext._runtime = runtime;
//    [_appContext registerNativeModules];
//  }
}

/**
 This should be called inside `[EXNativeModulesProxy setBridge:]`.
 */
- (void)legacyProxyDidSetBridge:(nonnull EXNativeModulesProxy *)moduleProxy
           legacyModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry
{
  _appContext.legacyModulesProxy = moduleProxy;
  _appContext.legacyModuleRegistry = moduleRegistry;
}

/**
 A synchronous method that is called from JS before requiring
 any module to ensure that all necessary bindings are installed.
 */
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(installModules)
{
//  if (_bridge && !_appContext._runtime) {
//    // If `setBridge:` was called but the runtime was not found, we try again here.
//    [self maybeSetupAppContext];
//  }
  return nil;
}

@end
