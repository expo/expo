#if WORKLETS_ENABLED

#include "WorkletJSCallInvoker.h"

namespace expo {

  WorkletJSCallInvoker::WorkletJSCallInvoker(
    std::weak_ptr<worklets::WorkletRuntime> &workletRuntimeHolder
  ) : workletRuntimeHolder_(workletRuntimeHolder) {}

  void WorkletJSCallInvoker::invokeAsync(react::CallFunc &&func) noexcept {
    auto workletRuntime = workletRuntimeHolder_.lock();
    if (!workletRuntime) {
      return;
    }

    workletRuntime->schedule(std::move(func));
  }


  void WorkletJSCallInvoker::invokeSync(react::CallFunc &&func) {
    auto workletRuntime = workletRuntimeHolder_.lock();
    if (!workletRuntime) {
      return;
    }

    workletRuntime->runSync(func);
  }
} // namespace expo

#endif
