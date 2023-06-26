#import <ABI49_0_0RNReanimated/Scheduler.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#import <ABI49_0_0ReactCommon/ABI49_0_0CallInvoker.h>
#include <stdio.h>
#include <memory>

namespace ABI49_0_0reanimated {

using namespace ABI49_0_0facebook;
using namespace ABI49_0_0React;

class ABI49_0_0REAIOSScheduler : public Scheduler {
 public:
  ABI49_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI49_0_0REAIOSScheduler();
};

} // namespace reanimated
