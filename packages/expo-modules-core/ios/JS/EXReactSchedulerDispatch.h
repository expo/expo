// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <memory>

namespace facebook {
namespace react {
class RuntimeScheduler;
} // namespace react
} // namespace facebook

namespace expo {

/**
 Creates an opaque handle for `dispatchOnReactScheduler` that references the given React
 runtime scheduler weakly. Returns `nullptr` when the scheduler is `nullptr` (e.g. no
 `RuntimeSchedulerBinding` was installed).

 The handle is never freed by design. Dispatch calls are bounded only by the lifetime of the
 `JavaScriptRuntime` wrapper, which any escaped closure can extend past every point at which
 the handle could be safely deleted, so this costs one small leaked allocation per runtime
 creation instead of risking a use-after-free.
 */
void *createReactSchedulerHandle(const std::shared_ptr<facebook::react::RuntimeScheduler> &scheduler);

/**
 Trampoline that `ExpoModulesJSI` calls to dispatch work onto the JS thread. Locks the
 scheduler weakly referenced by the handle (created with `createReactSchedulerHandle`) and
 calls `scheduleTask` on it. The React instance owns the scheduler and destroys it on
 teardown (e.g. reload) while native code may still dispatch through a retained
 `JavaScriptRuntime`, so when the scheduler is gone the task is dropped instead of
 dereferencing freed memory. The signature matches `expo::RuntimeScheduler::ScheduleFn`
 declared in the xcframework's `RuntimeScheduler.h`.

 Lives in ExpoModulesCore (rather than in the xcframework) so that
 ExpoModulesJSI.framework's prebuilt binary doesn't need to link against
 React-runtimescheduler. That matters for source-built RN, where those symbols
 are hidden after link and unreachable via -undefined dynamic_lookup.

 Hosts that initialize their own runtime (e.g. ExpoReactNativeFactory, Expo Go)
 pass `&expo::dispatchOnReactScheduler` as the `dispatch` argument to
 `AppContext.setRuntime`, with the handle as the `scheduler` argument.
 */
void dispatchOnReactScheduler(void *schedulerHandle, int priority, void (^callback)()) noexcept;

} // namespace expo

#endif // __cplusplus
