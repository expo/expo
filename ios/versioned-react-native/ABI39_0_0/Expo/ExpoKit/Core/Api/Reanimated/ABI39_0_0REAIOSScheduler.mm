#include "ABI39_0_0REAIOSScheduler.h"

namespace ABI39_0_0reanimated {

using namespace ABI39_0_0facebook;
using namespace ABI39_0_0React;

ABI39_0_0REAIOSScheduler::ABI39_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker) {
  this->jsCallInvoker_ = jsInvoker;
}

void ABI39_0_0REAIOSScheduler::scheduleOnUI(std::function<void()> job) {
  Scheduler::scheduleOnUI(job);
  dispatch_async(dispatch_get_main_queue(), ^{
    triggerUI();
  });
}

ABI39_0_0REAIOSScheduler::~ABI39_0_0REAIOSScheduler(){}

}
