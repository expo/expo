#include "ABI43_0_0REAIOSScheduler.h"
#include "RuntimeManager.h"

namespace ABI43_0_0reanimated {

using namespace ABI43_0_0facebook;
using namespace ABI43_0_0React;

ABI43_0_0REAIOSScheduler::ABI43_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker) {
  this->jsCallInvoker_ = jsInvoker;
}

void ABI43_0_0REAIOSScheduler::scheduleOnUI(std::function<void()> job) {
  if (runtimeManager.lock() == nullptr) {
    return;
  }

  if([NSThread isMainThread]) {
    if (runtimeManager.lock()) job();
    return;
  }

  Scheduler::scheduleOnUI(job);
  if([NSThread isMainThread]) {
    if (runtimeManager.lock()) triggerUI();
    return;
  }

  __block std::weak_ptr<RuntimeManager> blockRuntimeManager = runtimeManager;

  dispatch_async(dispatch_get_main_queue(), ^{
    if (blockRuntimeManager.lock()) triggerUI();
  });
}

ABI43_0_0REAIOSScheduler::~ABI43_0_0REAIOSScheduler(){
}

}
