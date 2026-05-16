// Copyright 2025-present 650 Industries. All rights reserved.

#import "EXReactSchedulerDispatch.h"

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>

namespace expo {

void dispatchOnReactScheduler(void *nativeScheduler, int priority, void (^callback)()) noexcept
{
  auto *scheduler = static_cast<facebook::react::RuntimeScheduler *>(nativeScheduler);
  scheduler->scheduleTask(
    static_cast<facebook::react::SchedulerPriority>(priority),
    [callback](facebook::jsi::Runtime &) {
      callback();
    });
}

} // namespace expo
