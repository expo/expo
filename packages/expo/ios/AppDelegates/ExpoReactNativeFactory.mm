// Copyright 2025-present 650 Industries. All rights reserved.

#import <Expo/ExpoReactNativeFactory.h>
#import <ExpoModulesCore/EXHostWrapper.h>

// When using xcframeworks, the generated Swift
// header is inside ExpoModulesCore module. Otherwise, it's available only
// locally with double-quoted imports.
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#elif __has_include("ExpoModulesCore-Swift.h")
#import "ExpoModulesCore-Swift.h"
#endif


#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
#import "ExpoModulesCore-Swift.h"
#endif
#import <ReactCommon/RCTHost.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#import <ExpoModulesCore/EXReactSchedulerDispatch.h>

@implementation EXReactNativeFactory {
  EXAppContext *_appContext;
}

#pragma mark - RCTHostDelegate

#if TARGET_OS_OSX
// TODO: remove when bumping react-native-macos to 0.85
- (void)hostDidStart:(nonnull RCTHost *)host
{
  host.runtimeDelegate = self;
}
#endif

// [JS thread]
- (void)host:(nonnull RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  // On reload, this callback runs on the new instance's JS thread while the
  // previous instance may still be tearing down its runtime on another thread.
  // Replacing the ivar must not drop the last strong reference to the previous
  // AppContext at this point: if it deallocates before the old runtime's
  // teardown reaches the `expo.modules` host object finalizer, the finalizer's
  // weak reference is already nil so `AppContext.destroy()` never runs, and the
  // deinit cascade releases the module holders' cached JavaScriptObjects
  // against a runtime that is being destroyed (EXC_BAD_ACCESS in
  // `ModuleHolder.deinit` → ExpoModulesJSI). Defer the release so the old
  // runtime can finish tearing down — its finalizer runs `destroy()` and
  // clears all JSI wrappers — making the deferred deinit JSI-free.
  if (_appContext != nil) {
    EXAppContext *previousAppContext = _appContext;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      // The block's strong capture keeps the previous context alive until here;
      // it deallocates with the block right after this runs.
      (void)previousAppContext;
    });
  }
  _appContext = [[EXAppContext alloc] init];

  // Resolve the React runtime scheduler so ExpoModulesJSI can dispatch work onto
  // the JS thread. Doing it here (rather than inside the xcframework) keeps
  // React-runtimescheduler symbols out of the prebuilt ExpoModulesJSI.framework
  // — important for source-built RN, where those symbols are hidden after link
  // and unreachable via -undefined dynamic_lookup.
  //
  // If RN didn't install a RuntimeSchedulerBinding for some reason, pass nullptr
  // for both — AppContext.setRuntime falls back to a synchronous no-op scheduler
  // so the app still launches; modules that require async dispatch can gate on
  // `JavaScriptRuntime.supportsAsyncScheduling`.
  auto binding = facebook::react::RuntimeSchedulerBinding::getBinding(runtime);
  auto scheduler = binding ? binding->getRuntimeScheduler() : nullptr;

  [_appContext setRuntime:&runtime
                scheduler:scheduler.get()
                 dispatch:scheduler ? reinterpret_cast<const void *>(&expo::dispatchOnReactScheduler) : nullptr];
  [_appContext setHostWrapper:[[EXHostWrapper alloc] initWithHost:host]];

  [_appContext registerNativeModules];
}

@end
