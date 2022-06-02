#import <ABI45_0_0RNReanimated/ABI45_0_0REAIOSScheduler.h>
#import <ABI45_0_0RNReanimated/RuntimeManager.h>

namespace ABI45_0_0reanimated {

using namespace ABI45_0_0facebook;
using namespace ABI45_0_0React;

ABI45_0_0REAIOSScheduler::ABI45_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker)
{
  this->jsCallInvoker_ = jsInvoker;
}

void ABI45_0_0REAIOSScheduler::scheduleOnUI(std::function<void()> job)
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

ABI45_0_0REAIOSScheduler::~ABI45_0_0REAIOSScheduler() {}

}
