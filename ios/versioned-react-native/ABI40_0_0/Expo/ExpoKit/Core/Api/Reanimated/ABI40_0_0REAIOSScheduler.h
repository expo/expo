#pragma once

#include <stdio.h>
#include "ABI40_0_0Scheduler.h"
#import <ABI40_0_0ReactCommon/ABI40_0_0CallInvoker.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>

namespace ABI40_0_0reanimated
{

using namespace ABI40_0_0facebook;
using namespace ABI40_0_0React;

class ABI40_0_0REAIOSScheduler : public Scheduler {
  public:
  ABI40_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI40_0_0REAIOSScheduler();
};

} // namespace ABI40_0_0reanimated
