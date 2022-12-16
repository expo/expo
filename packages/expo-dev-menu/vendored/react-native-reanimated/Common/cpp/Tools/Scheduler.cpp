#include "DevMenuScheduler.h"

namespace devmenureanimated {

void Scheduler::scheduleOnUI(std::function<void()> job) {
  uiJobs.push(std::move(job));
}

void Scheduler::scheduleOnJS(std::function<void()> job) {
  jsCallInvoker_->invokeAsync(std::move(job));
}

void Scheduler::triggerUI() {
  scheduledOnUI = false;
  while (uiJobs.getSize()) {
    auto job = uiJobs.pop();
    job();
  }
}

void Scheduler::setJSCallInvoker(
    std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker) {
  jsCallInvoker_ = jsCallInvoker;
}

void Scheduler::setRuntimeManager(
    std::shared_ptr<RuntimeManager> runtimeManager) {
  this->runtimeManager = runtimeManager;
}

Scheduler::~Scheduler() {}

Scheduler::Scheduler() {
  this->scheduledOnUI = false;
}

} // namespace devmenureanimated
