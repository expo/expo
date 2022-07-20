#import "DevMenuREAIOSScheduler.h"
#import "DevMenuRuntimeManager.h"

namespace devmenureanimated {

using namespace facebook;
using namespace react;

DevMenuREAIOSScheduler::DevMenuREAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker)
{
  this->jsCallInvoker_ = jsInvoker;
}

void DevMenuREAIOSScheduler::scheduleOnUI(std::function<void()> job)
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

DevMenuREAIOSScheduler::~DevMenuREAIOSScheduler() {}

}
