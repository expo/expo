#include "UIScheduler.h"
#include "ReanimatedRuntime.h"

#include <utility>

namespace reanimated {

void UIScheduler::scheduleOnUI(std::function<void()> job) {
  uiJobs_.push(std::move(job));
}

void UIScheduler::triggerUI() {
  scheduledOnUI_ = false;
  while (uiJobs_.getSize()) {
    const auto job = uiJobs_.pop();
    job();
  }
}

} // namespace reanimated
