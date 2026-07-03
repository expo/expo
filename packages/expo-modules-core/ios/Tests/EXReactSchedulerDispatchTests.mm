// Copyright 2025-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

#import <ExpoModulesCore/EXReactSchedulerDispatch.h>

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>

using facebook::react::RuntimeScheduler;

@interface EXReactSchedulerDispatchTests : XCTestCase
@end

@implementation EXReactSchedulerDispatchTests

- (void)testCreatingHandleWithoutSchedulerReturnsNull
{
  XCTAssertEqual(expo::createReactSchedulerHandle(nullptr), nullptr);
}

- (void)testDispatchForwardsTaskToLiveScheduler
{
  auto scheduledWorkCount = std::make_shared<int>(0);
  auto scheduler = std::make_shared<RuntimeScheduler>(
    [scheduledWorkCount](std::function<void(facebook::jsi::Runtime &)> &&work) {
      (*scheduledWorkCount)++;
    });
  void *handle = expo::createReactSchedulerHandle(scheduler);
  XCTAssertNotEqual(handle, nullptr);

  expo::dispatchOnReactScheduler(handle, /* UserBlockingPriority */ 2, ^{});

  // The scheduler requested a work loop from the runtime executor, which is how a scheduled
  // task reaches the JS thread. Running the loop requires a jsi::Runtime, so this test only
  // asserts that the task was handed over to the scheduler.
  XCTAssertEqual(*scheduledWorkCount, 1);
}

- (void)testDispatchDropsTaskWhenSchedulerIsGone
{
  auto scheduledWorkCount = std::make_shared<int>(0);
  auto scheduler = std::make_shared<RuntimeScheduler>(
    [scheduledWorkCount](std::function<void(facebook::jsi::Runtime &)> &&work) {
      (*scheduledWorkCount)++;
    });
  void *handle = expo::createReactSchedulerHandle(scheduler);

  // The React instance owns the scheduler and destroys it on teardown (e.g. reload),
  // while native code can keep dispatching through a retained JavaScriptRuntime.
  // The handle must not extend the scheduler's lifetime, so once the owner releases it,
  // dispatching cannot reach the scheduler at all anymore.
  scheduler.reset();

  __block BOOL called = NO;
  expo::dispatchOnReactScheduler(handle, /* ImmediatePriority */ 1, ^{
    called = YES;
  });

  XCTAssertFalse(called);
  XCTAssertEqual(*scheduledWorkCount, 0);
}

@end
