#pragma once

#ifdef __cplusplus

#include <atomic>
#include <swift/bridging>

namespace expo {

/**
 Wrapper around React Native's RuntimeScheduler. The native scheduler reference
 and dispatch trampoline are supplied by the host (e.g. ExpoReactNativeFactory)
 at construction time. The xcframework intentionally avoids linking against
 React-runtimescheduler so the prebuilt binary works with hosts that build RN
 either as a dynamic framework or as a static archive — without needing
 -undefined dynamic_lookup to resolve React internals.

 Priority values mirror facebook::react::SchedulerPriority — kept here as a
 plain enum so we don't include the React header.
 */
class RuntimeScheduler {
public:
  enum class Priority : int {
    ImmediatePriority = 1,
    UserBlockingPriority = 2,
    NormalPriority = 3,
    LowPriority = 4,
    IdlePriority = 5,
  };

  using ScheduleTaskCallback = void(^)();

  /**
   Trampoline implemented by the host. It resolves `nativeScheduler` (an opaque
   host-owned handle) to the real react::RuntimeScheduler and calls scheduleTask
   on it, or drops the task when the scheduler no longer exists. Keeping it as a
   function pointer keeps React types out of this header.
   */
  using ScheduleFn = void (*)(void *nativeScheduler, int priority, ScheduleTaskCallback callback);

private:
  void *const nativeScheduler{nullptr};
  const ScheduleFn scheduleFn{nullptr};

  std::atomic<int> refCount{1};

  RuntimeScheduler(void *scheduler, ScheduleFn fn) noexcept
      : nativeScheduler(scheduler), scheduleFn(fn) {}

  RuntimeScheduler() noexcept {}

public:
  // Swift creates instances through the static `create` functions rather than the constructors.
  // Annotating the constructors with `SWIFT_RETURNS_RETAINED` silences the Swift 6.4 "cannot infer
  // ownership" warning, but Swift 6.2 rejects that annotation on a constructor as an error. Static
  // functions returning a shared reference accept the annotation on every Swift version.

  /**
   Creates a scheduler bound to a host-provided native RuntimeScheduler.
   `scheduleTask` dispatches through `fn`, which the host implements against
   the real react::RuntimeScheduler.
   */
  static RuntimeScheduler *create(void *scheduler, ScheduleFn fn) noexcept SWIFT_RETURNS_RETAINED {
    return new RuntimeScheduler(scheduler, fn);
  }

  /**
   Creates a no-op scheduler. Scheduled tasks run synchronously on the
   caller's thread — intended for standalone runtimes (e.g. tests) that have
   no React scheduler.
   */
  static RuntimeScheduler *create() noexcept SWIFT_RETURNS_RETAINED {
    return new RuntimeScheduler();
  }

  RuntimeScheduler(const RuntimeScheduler &) = delete;

  /**
   Whether the scheduler can dispatch work asynchronously to the JS thread.
   When false, tasks run synchronously and callers should avoid dispatching to background queues.
   */
  bool supportsAsyncScheduling() const noexcept {
    return scheduleFn != nullptr;
  }

  void scheduleTask(Priority priority, ScheduleTaskCallback callback) noexcept {
    if (scheduleFn != nullptr) {
      scheduleFn(nativeScheduler, static_cast<int>(priority), callback);
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
