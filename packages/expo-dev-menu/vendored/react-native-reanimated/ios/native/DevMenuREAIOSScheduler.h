#import "DevMenuScheduler.h"
#import <React/RCTUIManager.h>
#import <ReactCommon/CallInvoker.h>
#include <stdio.h>
#include <memory>

namespace devmenureanimated {

using namespace facebook;
using namespace react;

class DevMenuREAIOSScheduler : public Scheduler {
 public:
  DevMenuREAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~DevMenuREAIOSScheduler();
};

} // namespace devmenureanimated
