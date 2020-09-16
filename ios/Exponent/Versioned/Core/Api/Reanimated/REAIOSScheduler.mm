#include "REAIOSScheduler.h"

namespace reanimated {

using namespace facebook;
using namespace react;

REAIOSScheduler::REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker) {
  this->jsCallInvoker_ = jsInvoker;
}

void REAIOSScheduler::scheduleOnUI(std::function<void()> job) {
  Scheduler::scheduleOnUI(job);
  dispatch_async(dispatch_get_main_queue(), ^{
    triggerUI();
  });
}

REAIOSScheduler::~REAIOSScheduler(){}

}
