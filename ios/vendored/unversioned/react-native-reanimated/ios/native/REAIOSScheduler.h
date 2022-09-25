#import <RNReanimated/Scheduler.h>
#import <React/RCTUIManager.h>
#import <ReactCommon/CallInvoker.h>
#include <stdio.h>
#include <memory>

namespace reanimated {

using namespace facebook;
using namespace react;

class REAIOSScheduler : public Scheduler {
 public:
  REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~REAIOSScheduler();
};

} // namespace reanimated
