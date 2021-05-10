#include "ABI40_0_0Scheduler.h"

namespace ABI40_0_0reanimated
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

void Scheduler::setJSCallInvoker(std::shared_ptr<ABI40_0_0facebook::ABI40_0_0React::CallInvoker> jsCallInvoker) {
  jsCallInvoker_ = jsCallInvoker;
}

void Scheduler::setModule(std::shared_ptr<NativeReanimatedModule> module) {
  this->module = module;
}

Scheduler::~Scheduler() {}

}
