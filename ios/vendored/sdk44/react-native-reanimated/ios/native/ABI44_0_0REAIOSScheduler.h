#pragma once

#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import <ABI44_0_0ReactCommon/ABI44_0_0CallInvoker.h>
#include <stdio.h>
#include <memory>
#include "Scheduler.h"

namespace ABI44_0_0reanimated {

using namespace ABI44_0_0facebook;
using namespace ABI44_0_0React;

class ABI44_0_0REAIOSScheduler : public Scheduler {
 public:
  ABI44_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~ABI44_0_0REAIOSScheduler();
};

} // namespace reanimated
