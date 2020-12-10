#include "ABI39_0_0Scheduler.h"

namespace ABI39_0_0reanimated
{

void Scheduler::scheduleOnUI(std::function<void()> job) {
  uiJobs.push(std::move(job));
}

void Scheduler::scheduleOnJS(std::function<void()> job) {
  jsCallInvoker_->invokeAsync(std::move(job));
}

void Scheduler::triggerUI() {
  auto job = uiJobs.pop();
  job();
}

void Scheduler::setJSCallInvoker(std::shared_ptr<ABI39_0_0facebook::ABI39_0_0React::CallInvoker> jsCallInvoker) {
  jsCallInvoker_ = jsCallInvoker;
}

Scheduler::~Scheduler() {}

}
