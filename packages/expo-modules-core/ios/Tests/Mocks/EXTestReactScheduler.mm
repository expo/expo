// Copyright 2025-present 650 Industries. All rights reserved.

#import "EXTestReactScheduler.h"

#import <ExpoModulesCore/EXReactSchedulerDispatch.h>

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>

@implementation EXTestReactScheduler {
  std::shared_ptr<facebook::react::RuntimeScheduler> _scheduler;
  std::shared_ptr<std::vector<std::function<void(facebook::jsi::Runtime &)>>> _workLoops;
}

- (instancetype)init
{
  if (self = [super init]) {
    auto workLoops = std::make_shared<std::vector<std::function<void(facebook::jsi::Runtime &)>>>();
    _workLoops = workLoops;
    _scheduler = std::make_shared<facebook::react::RuntimeScheduler>(
      [workLoops](std::function<void(facebook::jsi::Runtime &)> &&work) {
        workLoops->push_back(std::move(work));
      });
    _schedulerHandle = expo::createReactSchedulerHandle(_scheduler);
    _dispatchFunction = reinterpret_cast<const void *>(&expo::dispatchOnReactScheduler);
  }
  return self;
}

- (NSInteger)scheduledWorkLoopCount
{
  return (NSInteger)_workLoops->size();
}

- (void)drainWorkLoopsWithRuntime:(void *)jsiRuntimePointer
{
  auto *runtime = static_cast<facebook::jsi::Runtime *>(jsiRuntimePointer);
  auto workLoops = std::move(*_workLoops);
  _workLoops->clear();
  for (auto &workLoop : workLoops) {
    workLoop(*runtime);
  }
}

- (void)destroyScheduler
{
  _scheduler.reset();
}

@end
