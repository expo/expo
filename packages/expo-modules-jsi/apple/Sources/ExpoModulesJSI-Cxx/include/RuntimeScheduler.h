#pragma once

#ifdef __cplusplus

#include <memory>
#include <swift/bridging>
#include <jsi/jsi.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

/**
 Returns a reference to the RuntimeScheduler from the runtime binding.
 The returned reference is not owned and should not be deleted.
 */
std::shared_ptr<react::RuntimeScheduler> runtimeSchedulerForRuntime(jsi::Runtime &runtime) {
  if (auto binding = react::RuntimeSchedulerBinding::getBinding(runtime)) {
    return binding->getRuntimeScheduler();
  }
  // No binding found (e.g. runtime not initialized by React Native).
  // Execute the callback synchronously — this only happens in test environments
  // where the runtime is not managed by React Native, so there is no dedicated
  // JS thread to dispatch to.
  react::RuntimeExecutor runtimeExecutor = [&runtime](std::function<void(jsi::Runtime&)>&& callback) {
    callback(runtime);
  };
  return std::make_shared<react::RuntimeScheduler>(runtimeExecutor);
}

/**
 Wrapper for RuntimeScheduler from React which for some reason cannot be constructed from Swift.
 Imported as a shared reference type so Swift manages its lifetime via retain/release.
 */
class RuntimeScheduler {
private:
  std::shared_ptr<react::RuntimeScheduler> reactRuntimeScheduler;

  /**
   Reference count managed by Swift's ARC via SWIFT_SHARED_REFERENCE.
   Prevents premature deallocation when C++ shared_ptr and Swift references coexist.
   */
  std::atomic<int> refCount{1};

public:
  RuntimeScheduler(jsi::Runtime &runtime) : reactRuntimeScheduler(runtimeSchedulerForRuntime(runtime)) {}
  RuntimeScheduler(const RuntimeScheduler &) = delete; // non-copyable

  using ScheduleTaskCallback = void(^)();

  void scheduleTask(react::SchedulerPriority priority, ScheduleTaskCallback callback) noexcept {
    reactRuntimeScheduler->scheduleTask(priority, [callback = std::move(callback)](jsi::Runtime &runtime) {
      callback();
    });
  }

  void retain() {
    refCount.fetch_add(1, std::memory_order_relaxed);
  }

  void release() {
    if (refCount.fetch_sub(1, std::memory_order_acq_rel) == 1) {
      delete this;
    }
  }
} SWIFT_SHARED_REFERENCE(retainRuntimeScheduler, releaseRuntimeScheduler);

} // namespace expo

/** Retains the RuntimeScheduler, called by Swift's ARC. */
inline void retainRuntimeScheduler(expo::RuntimeScheduler *scheduler) {
  scheduler->retain();
}

/** Releases the RuntimeScheduler, called by Swift's ARC. Deallocates when the ref count reaches zero. */
inline void releaseRuntimeScheduler(expo::RuntimeScheduler *scheduler) {
  scheduler->release();
}

#endif // __cplusplus
