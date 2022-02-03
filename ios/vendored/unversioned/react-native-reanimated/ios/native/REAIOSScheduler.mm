#include "REAIOSScheduler.h"
#include "RuntimeManager.h"

namespace reanimated {

using namespace facebook;
using namespace react;

REAIOSScheduler::REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker)
{
  this->jsCallInvoker_ = jsInvoker;
}

void REAIOSScheduler::scheduleOnUI(std::function<void()> job)
{
  if (runtimeManager.lock() == nullptr) {
    return;
  }

  if ([NSThread isMainThread]) {
    if (runtimeManager.lock()) {
      job();
    }
    return;
  }

  Scheduler::scheduleOnUI(job);
  if ([NSThread isMainThread]) {
    if (runtimeManager.lock()) {
      triggerUI();
    }
    return;
  }

  if (!this->scheduledOnUI) {
    __block std::weak_ptr<RuntimeManager> blockRuntimeManager = runtimeManager;

    dispatch_async(dispatch_get_main_queue(), ^{
      if (blockRuntimeManager.lock()) {
        triggerUI();
      }
    });
  }
}

REAIOSScheduler::~REAIOSScheduler() {}

}
