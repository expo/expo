#pragma once

#include <stdio.h>
#include "ABI39_0_0Scheduler.h"
#import <ABI39_0_0ReactCommon/ABI39_0_0CallInvoker.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManager.h>

namespace ABI39_0_0reanimated
{

using namespace ABI39_0_0facebook;
using namespace ABI39_0_0React;

class ABI39_0_0REAIOSScheduler : public Scheduler {
  std::shared_ptr<CallInvoker> jsInvoker;
  public:
  ABI39_0_0REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  void scheduleOnJS(std::function<void()> job) override;
  virtual ~ABI39_0_0REAIOSScheduler();
};

} // namespace ABI39_0_0reanimated
