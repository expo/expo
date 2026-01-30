#pragma once

#ifdef __cplusplus

#include <memory>
#include <swift/bridging>
#include <jsi/jsi.h>

namespace facebook::react {

using RawCallback = std::function<void(jsi::Runtime &)>;

enum class SchedulerPriority : int {
  ImmediatePriority = 1,
  UserBlockingPriority = 2,
  NormalPriority = 3,
  LowPriority = 4,
  IdlePriority = 5,
};

struct Task final : public jsi::NativeState {};

class RuntimeScheduler {
public:
  std::shared_ptr<Task> scheduleTask(SchedulerPriority priority, RawCallback &&callback) noexcept;
} SWIFT_UNSAFE_REFERENCE;

class RuntimeSchedulerBinding : public jsi::HostObject {
public:
  static std::shared_ptr<RuntimeSchedulerBinding> getBinding(jsi::Runtime &runtime);
  std::shared_ptr<RuntimeScheduler> getRuntimeScheduler() noexcept;
};

} // namespace facebook::react

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

std::shared_ptr<react::RuntimeScheduler> runtimeSchedulerFromRuntime(jsi::Runtime &runtime) {
  if (auto binding = react::RuntimeSchedulerBinding::getBinding(runtime)) {
    return binding->getRuntimeScheduler();
  }
  return nullptr;
}

/**
 Wrapper for RuntimeScheduler from React which for some reason cannot be constructed from Swift.
 */
class RuntimeScheduler {
private:
  std::shared_ptr<react::RuntimeScheduler> reactRuntimeScheduler;

public:
  RuntimeScheduler(jsi::Runtime &runtime) : reactRuntimeScheduler(runtimeSchedulerFromRuntime(runtime)) {}

  using ScheduleTaskCallback = void(^)();

  void scheduleTask(react::SchedulerPriority priority, ScheduleTaskCallback callback) noexcept {
    reactRuntimeScheduler->scheduleTask(priority, [callback = std::move(callback)](jsi::Runtime &runtime) {
      callback();
    });
  }
} SWIFT_UNSAFE_REFERENCE; // class RuntimeScheduler

} // namespace expo

#endif // __cplusplus
