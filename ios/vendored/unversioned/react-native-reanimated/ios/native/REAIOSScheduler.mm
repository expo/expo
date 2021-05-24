#include "REAIOSScheduler.h"

namespace reanimated {

using namespace facebook;
using namespace react;

REAIOSScheduler::REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker) {
  this->jsCallInvoker_ = jsInvoker;
}

void REAIOSScheduler::scheduleOnUI(std::function<void()> job) {
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

REAIOSScheduler::~REAIOSScheduler(){
}

}
