#import <ABI45_0_0RNReanimated/Scheduler.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>
#import <ABI45_0_0ReactCommon/ABI45_0_0CallInvoker.h>
#include <stdio.h>
#include <memory>

namespace ABI45_0_0reanimated {

using namespace ABI45_0_0facebook;
using namespace ABI45_0_0React;

class ABI45_0_0REAIOSScheduler : public Scheduler {
 public:
  ABI45_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI45_0_0REAIOSScheduler();
};

} // namespace reanimated
