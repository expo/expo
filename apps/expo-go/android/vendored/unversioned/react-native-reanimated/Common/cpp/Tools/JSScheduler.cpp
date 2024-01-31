#include "JSScheduler.h"

#include <utility>

namespace reanimated {

void JSScheduler::scheduleOnJS(std::function<void(jsi::Runtime &rt)> job) {
  jsCallInvoker_->invokeAsync(
      [job = std::move(job), &rt = rnRuntime_] { job(rt); });
}

} // namespace reanimated
