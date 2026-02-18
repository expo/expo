// Copyright 2024-present 650 Industries. All rights reserved.

#import <ReactCommon/RCTTurboModule.h>
#import <ExpoModulesCore/ExpoBridgeModule.h>
#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesCore/Swift.h>

@interface RCTBridge ()
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;
@end

extern dispatch_queue_t RCTJSThread;
static NSString *const EXJavaScriptThreadName = @"com.facebook.react.runtime.JavaScript";

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
  if (!_bridge) {
    return;
  }

  _appContext.reactBridge = _bridge;
  __weak __typeof(self) weakSelf = self;
  void (^setupAppContext)(void) = ^{
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf || !strongSelf->_bridge || strongSelf->_appContext._runtime) {
      return;
    }

    EXRuntime *runtime = [EXJavaScriptRuntimeManager runtimeFromBridge:strongSelf->_bridge];
    if (!runtime || [[runtime global] hasProperty:@"expo"]) {
      return;
    }

    NSLog(@"Expo is being initialized from the deprecated ExpoBridgeModule, make sure to migrate to ExpoReactNativeFactory in your project");
    strongSelf->_appContext._runtime = runtime;
    if ([NSThread isMainThread]) {
      [strongSelf->_appContext registerNativeModules];
    } else {
      // Registering native modules must happen on main for UI-backed modules,
      // but synchronously to prevent JS from accessing modules before registration.
      dispatch_sync(dispatch_get_main_queue(), ^{
        [strongSelf->_appContext registerNativeModules];
      });
    }
  };

  if ([[NSThread currentThread].name isEqualToString:EXJavaScriptThreadName]) {
    setupAppContext();
  } else {
    [_bridge dispatchBlock:setupAppContext queue:RCTJSThread];
  }
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
  if (_bridge && !_appContext._runtime) {
    // If `setBridge:` was called but the runtime was not found, we try again here.
    [self maybeSetupAppContext];
  }
  return nil;
}

@end
