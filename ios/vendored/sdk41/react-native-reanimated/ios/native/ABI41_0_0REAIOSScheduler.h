#pragma once

#include <stdio.h>
#include "Scheduler.h"
#import <ABI41_0_0ReactCommon/ABI41_0_0CallInvoker.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>

namespace ABI41_0_0reanimated
{

using namespace ABI41_0_0facebook;
using namespace ABI41_0_0React;

class ABI41_0_0REAIOSScheduler : public Scheduler {
  public:
  ABI41_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI41_0_0REAIOSScheduler();
};

} // namespace reanimated
