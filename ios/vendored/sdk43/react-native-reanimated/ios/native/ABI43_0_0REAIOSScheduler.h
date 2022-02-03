#pragma once

#include <stdio.h>
#include "Scheduler.h"
#import <ABI43_0_0ReactCommon/ABI43_0_0CallInvoker.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>

namespace ABI43_0_0reanimated
{

using namespace ABI43_0_0facebook;
using namespace ABI43_0_0React;

class ABI43_0_0REAIOSScheduler : public Scheduler {
  public:
  ABI43_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI43_0_0REAIOSScheduler();
};

} // namespace reanimated
