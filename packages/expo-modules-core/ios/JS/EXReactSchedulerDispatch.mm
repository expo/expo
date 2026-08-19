// Copyright 2025-present 650 Industries. All rights reserved.

#import "EXReactSchedulerDispatch.h"

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>

namespace expo {

namespace {

struct SchedulerHandle {
  std::weak_ptr<facebook::react::RuntimeScheduler> scheduler;
};

} // namespace

void *createReactSchedulerHandle(const std::shared_ptr<facebook::react::RuntimeScheduler> &scheduler)
{
  if (!scheduler) {
    return nullptr;
  }
  return new SchedulerHandle{scheduler};
}

void dispatchOnReactScheduler(void *schedulerHandle, int priority, void (^callback)()) noexcept
{
  auto *handle = static_cast<SchedulerHandle *>(schedulerHandle);
  if (handle == nullptr) {
    // `createReactSchedulerHandle` returns null when there was no scheduler to reference.
    // Drop the task so callers don't have to guard the handle/dispatch pair themselves.
    return;
  }
  // Locking either keeps the scheduler alive for the duration of `scheduleTask` or reports
  // that the React instance already destroyed it, in which case the task is dropped.
  auto scheduler = handle->scheduler.lock();
  if (!scheduler) {
    return;
  }
  scheduler->scheduleTask(
    static_cast<facebook::react::SchedulerPriority>(priority),
    [callback](facebook::jsi::Runtime &) {
      callback();
    });
}

} // namespace expo
