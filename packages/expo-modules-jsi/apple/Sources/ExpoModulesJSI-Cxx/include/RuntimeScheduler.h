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
  /**
   Constructs the scheduler from a React Native runtime binding.
   Falls back to a no-op scheduler when no binding is installed.
   */
  RuntimeScheduler(jsi::Runtime &runtime) {
    if (auto binding = react::RuntimeSchedulerBinding::getBinding(runtime)) {
      reactRuntimeScheduler = binding->getRuntimeScheduler();
    }
  }

  /**
   Constructs a no-op scheduler for standalone runtimes (e.g. tests).
   Scheduled tasks are executed synchronously by the caller.
   */
  RuntimeScheduler() {}

  RuntimeScheduler(const RuntimeScheduler &) = delete; // non-copyable

  /**
   Whether the scheduler can dispatch work asynchronously to the JS thread.
   When false, tasks run synchronously and callers should avoid dispatching to background queues.
   */
  bool supportsAsyncScheduling() const noexcept {
    return reactRuntimeScheduler != nullptr;
  }

  using ScheduleTaskCallback = void(^)();

  void scheduleTask(react::SchedulerPriority priority, ScheduleTaskCallback callback) noexcept {
    if (reactRuntimeScheduler) {
      reactRuntimeScheduler->scheduleTask(priority, [callback = std::move(callback)](jsi::Runtime &runtime) {
        callback();
      });
    } else {
      callback();
    }
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
