// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Test double owning a real `react::RuntimeScheduler` whose runtime executor collects the
 requested work loops instead of running them. Lets Swift tests wire a `JavaScriptRuntime`
 to the React scheduler dispatch trampoline and exercise it end to end, including the
 reload scenario where the React instance destroys the scheduler while native code keeps
 scheduling through a retained runtime.
 */
@interface EXTestReactScheduler : NSObject

/**
 Opaque handle for the `scheduler` argument of `AppContext.setRuntime` or
 `JavaScriptRuntime.init(unsafePointer:scheduler:dispatch:)`, created by
 `expo::createReactSchedulerHandle`.
 */
@property (nonatomic, readonly, nullable) void *schedulerHandle;

/**
 Pointer to `expo::dispatchOnReactScheduler`, matching the `dispatch` argument of
 `AppContext.setRuntime` or `JavaScriptRuntime.init(unsafePointer:scheduler:dispatch:)`.
 */
@property (nonatomic, readonly) const void *dispatchFunction;

/**
 Number of work loops the scheduler has requested from its runtime executor so far.
 Grows when a task is scheduled through the dispatch trampoline.
 */
@property (nonatomic, readonly) NSInteger scheduledWorkLoopCount;

/**
 Runs the collected work loops against the given `facebook::jsi::Runtime` pointer,
 executing the scheduled tasks the way the JS thread would.
 */
- (void)drainWorkLoopsWithRuntime:(void *)jsiRuntimePointer;

/**
 Releases the scheduler the way the React instance does on teardown (e.g. reload).
 */
- (void)destroyScheduler;

@end

NS_ASSUME_NONNULL_END
