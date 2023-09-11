#import <ABI47_0_0RNReanimated/Scheduler.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <ABI47_0_0ReactCommon/ABI47_0_0CallInvoker.h>
#include <stdio.h>
#include <memory>

namespace ABI47_0_0reanimated {

using namespace ABI47_0_0facebook;
using namespace ABI47_0_0React;

class ABI47_0_0REAIOSScheduler : public Scheduler {
 public:
  ABI47_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI47_0_0REAIOSScheduler();
};

} // namespace reanimated
