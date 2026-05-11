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
  void (^retained)() = [callback copy];
  scheduler->scheduleTask(
    static_cast<facebook::react::SchedulerPriority>(priority),
    [retained](facebook::jsi::Runtime &) {
      retained();
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
  auto binding = facebook::react::RuntimeSchedulerBinding::getBinding(runtime);
  auto scheduler = binding ? binding->getRuntimeScheduler() : nullptr;
  NSAssert(scheduler != nullptr, @"React Native did not install a RuntimeScheduler before didInitializeRuntime; ExpoModulesJSI cannot dispatch work onto the JS thread.");

  [_appContext setRuntime:&runtime
          nativeScheduler:scheduler.get()
                 dispatch:reinterpret_cast<const void *>(&dispatchOnReactScheduler)];
  [_appContext setHostWrapper:[[EXHostWrapper alloc] initWithHost:host]];

  [_appContext registerNativeModules];
}

@end
