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
  // If no binding is found (can happen when the runtime is not initialized by React Native),
  // create a simple RuntimeExecutor that just invokes the callback immediately.
  // It's not great that we capture the runtime by reference, but the runtime scheduler
  // will never call it when the runtime is already destroyed so in theory it's safe.
  react::RuntimeExecutor runtimeExecutor = [&runtime](std::function<void(jsi::Runtime&)>&& callback) {
    callback(runtime);
  };
  // Create the RuntimeScheduler
  return std::make_shared<react::RuntimeScheduler>(runtimeExecutor);
}

/**
 Wrapper for RuntimeScheduler from React which for some reason cannot be constructed from Swift.
 */
class RuntimeScheduler {
private:
  std::shared_ptr<react::RuntimeScheduler> reactRuntimeScheduler;

public:
  RuntimeScheduler(jsi::Runtime &runtime) : reactRuntimeScheduler(runtimeSchedulerForRuntime(runtime)) {}

  using ScheduleTaskCallback = void(^)();

  void scheduleTask(react::SchedulerPriority priority, ScheduleTaskCallback callback) noexcept {
    reactRuntimeScheduler->scheduleTask(priority, [callback = std::move(callback)](jsi::Runtime &runtime) {
      callback();
    });
  }
} SWIFT_UNSAFE_REFERENCE; // class RuntimeScheduler

} // namespace expo

#endif // __cplusplus
