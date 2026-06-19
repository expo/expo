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

#import <React/RCTSurfacePresenter.h>
#import <react/utils/ContextContainer.h>
#import <ExpoModulesCore/ExpoAppContextHolder.h>
#import <ExpoModulesCore/ExpoViewPropsDecoder.h>

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

  // Make the app context reachable (weakly) from the Fabric props-parse path so view props
  // can be decoded straight from their JavaScript values on the JavaScript thread. The
  // ContextContainer is per-host and `insert` is safe to call through the const pointee.
  // `insert` is a no-op when the key already exists, so on a JS reload (a second
  // `didInitializeRuntime:` reusing the same container) it would leave the stale holder in
  // place — erase first so the new `_appContext` always wins.
  auto contextContainer = host.surfacePresenter.contextContainer;
  if (contextContainer) {
    contextContainer->erase(expo::ExpoAppContextHolder::kContextContainerKey);
    contextContainer->insert(
      expo::ExpoAppContextHolder::kContextContainerKey,
      expo::makeAppContextHolder(_appContext));
  }
}

@end
