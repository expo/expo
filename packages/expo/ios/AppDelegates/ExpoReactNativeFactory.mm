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
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

namespace {

// Trampoline that ExpoModulesJSI calls to dispatch work onto the JS thread.
// Defined here (rather than in the xcframework) so the xcframework's prebuilt
// binary doesn't need to link against React-runtimescheduler.
void dispatchOnReactScheduler(void *nativeScheduler, int priority, void (^callback)()) noexcept
{
  auto *scheduler = static_cast<facebook::react::RuntimeScheduler *>(nativeScheduler);
  scheduler->scheduleTask(
    static_cast<facebook::react::SchedulerPriority>(priority),
    [callback](facebook::jsi::Runtime &) {
      callback();
    });
}

} // namespace

@implementation EXReactNativeFactory {
  EXAppContext *_appContext;
}

#pragma mark - RCTHostDelegate

// [JS thread]
- (void)host:(nonnull RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
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
          nativeScheduler:scheduler.get()
                 dispatch:scheduler ? reinterpret_cast<const void *>(&dispatchOnReactScheduler) : nullptr];
  [_appContext setHostWrapper:[[EXHostWrapper alloc] initWithHost:host]];

  [_appContext registerNativeModules];
}

@end
