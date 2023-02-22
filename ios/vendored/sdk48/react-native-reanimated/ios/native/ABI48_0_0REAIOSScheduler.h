#import <ABI48_0_0RNReanimated/Scheduler.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0CallInvoker.h>
#include <stdio.h>
#include <memory>

namespace ABI48_0_0reanimated {

using namespace ABI48_0_0facebook;
using namespace ABI48_0_0React;

class ABI48_0_0REAIOSScheduler : public Scheduler {
 public:
  ABI48_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI48_0_0REAIOSScheduler();
};

} // namespace reanimated
