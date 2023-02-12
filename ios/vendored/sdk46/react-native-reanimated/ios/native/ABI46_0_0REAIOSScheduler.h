#import <ABI46_0_0RNReanimated/Scheduler.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>
#import <ABI46_0_0ReactCommon/ABI46_0_0CallInvoker.h>
#include <stdio.h>
#include <memory>

namespace ABI46_0_0reanimated {

using namespace ABI46_0_0facebook;
using namespace ABI46_0_0React;

class ABI46_0_0REAIOSScheduler : public Scheduler {
 public:
  ABI46_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI46_0_0REAIOSScheduler();
};

} // namespace reanimated
