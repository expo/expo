#include "REAIOSScheduler.h"

namespace reanimated {

using namespace facebook;
using namespace react;

REAIOSScheduler::REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker) {
  this->jsCallInvoker_ = jsInvoker;
}

void REAIOSScheduler::scheduleOnUI(std::function<void()> job) {
  if([NSThread isMainThread]) {
    if (module.lock()) job();
    return;
  }
  
  Scheduler::scheduleOnUI(job);
  if([NSThread isMainThread]) {
    if (module.lock()) triggerUI();
    return;
  }
  dispatch_async(dispatch_get_main_queue(), ^{
    if (module.lock()) triggerUI();
  });
}

REAIOSScheduler::~REAIOSScheduler(){
}

}
