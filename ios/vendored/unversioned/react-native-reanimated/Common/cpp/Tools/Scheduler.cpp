#ifdef __APPLE__
#include <RNReanimated/Scheduler.h>
#else
#include "Scheduler.h"
#endif
#include "ReanimatedRuntime.h"
#include "RuntimeManager.h"

namespace reanimated {

void Scheduler::scheduleOnUI(std::function<void()> job) {
  uiJobs.push(std::move(job));
}

void Scheduler::scheduleOnJS(std::function<void()> job) {
  jsCallInvoker_->invokeAsync(std::move(job));
}

void Scheduler::triggerUI() {
  scheduledOnUI = false;
#if JS_RUNTIME_HERMES
  // JSI's scope defined here allows for JSI-objects to be cleared up after
  // each runtime loop. Within these loops we typically create some temporary
  // JSI objects and hence it allows for such objects to be garbage collected
  // much sooner.
  // Apparently the scope API is only supported on Hermes at the moment.
  auto scope = jsi::Scope(*runtimeManager.lock()->runtime);
#endif
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

} // namespace reanimated
