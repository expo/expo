// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

namespace expo {

/**
 Trampoline that `ExpoModulesJSI` calls to dispatch work onto the JS thread.
 Casts the `nativeScheduler` pointer back to a `react::RuntimeScheduler *` and
 calls `scheduleTask` on it. The signature matches `expo::RuntimeScheduler::ScheduleFn`
 declared in the xcframework's `RuntimeScheduler.h`.

 Lives in ExpoModulesCore (rather than in the xcframework) so that
 ExpoModulesJSI.framework's prebuilt binary doesn't need to link against
 React-runtimescheduler — important for source-built RN, where those symbols
 are hidden after link and unreachable via -undefined dynamic_lookup.

 Hosts that initialize their own runtime (e.g. ExpoReactNativeFactory, Expo Go)
 pass `&expo::dispatchOnReactScheduler` as the `dispatch` argument to
 `AppContext.setRuntime`.
 */
void dispatchOnReactScheduler(void *nativeScheduler, int priority, void (^callback)()) noexcept;

} // namespace expo

#endif // __cplusplus
