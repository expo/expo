#include "ABI41_0_0REAIOSScheduler.h"

namespace ABI41_0_0reanimated {

using namespace ABI41_0_0facebook;
using namespace ABI41_0_0React;

ABI41_0_0REAIOSScheduler::ABI41_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker) {
  this->jsCallInvoker_ = jsInvoker;
}

void ABI41_0_0REAIOSScheduler::scheduleOnUI(std::function<void()> job) {
  if (module.lock() == nullptr) {
    return;
  }
  
  if([NSThread isMainThread]) {
    if (module.lock()) job();
    return;
  }
  
  Scheduler::scheduleOnUI(job);
  if([NSThread isMainThread]) {
    if (module.lock()) triggerUI();
    return;
  }
  
  __block std::weak_ptr<NativeReanimatedModule> blockModule = module;
  
  dispatch_async(dispatch_get_main_queue(), ^{
    if (blockModule.lock()) triggerUI();
  });
}

ABI41_0_0REAIOSScheduler::~ABI41_0_0REAIOSScheduler(){
}

}
