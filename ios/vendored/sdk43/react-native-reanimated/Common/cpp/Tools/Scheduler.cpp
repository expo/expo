#include "Scheduler.h"

namespace ABI43_0_0reanimated
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

void Scheduler::setJSCallInvoker(std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::CallInvoker> jsCallInvoker) {
  jsCallInvoker_ = jsCallInvoker;
}

void Scheduler::setRuntimeManager(std::shared_ptr<RuntimeManager> runtimeManager) {
  this->runtimeManager = runtimeManager;
}

Scheduler::~Scheduler() {}

}
