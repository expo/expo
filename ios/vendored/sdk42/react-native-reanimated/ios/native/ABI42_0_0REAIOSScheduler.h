#pragma once

#include <stdio.h>
#include "Scheduler.h"
#import <ABI42_0_0ReactCommon/ABI42_0_0CallInvoker.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>

namespace ABI42_0_0reanimated
{

using namespace ABI42_0_0facebook;
using namespace ABI42_0_0React;

class ABI42_0_0REAIOSScheduler : public Scheduler {
  public:
  ABI42_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI42_0_0REAIOSScheduler();
};

} // namespace reanimated
