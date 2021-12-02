#pragma once

#include <stdio.h>
#include "DevMenuScheduler.h"
#import <ReactCommon/CallInvoker.h>
#import <React/RCTUIManager.h>

namespace devmenureanimated
{

using namespace facebook;
using namespace react;

class REAIOSScheduler : public Scheduler {
  public:
  REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~REAIOSScheduler();
};

} // namespace devmenureanimated
