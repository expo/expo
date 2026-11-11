// Copyright 2026-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 *  Runs a JS task defined with `TaskManager.defineTask` right away, in the execution time of the caller,
 *  instead of when the system schedules it.
 */
@protocol EXTaskRunnerInterface <NSObject>

/**
 *  Executes the task with `data` as the `data` of the task body, and calls `completionHandler` on the main
 *  thread exactly once: with the value the task executor resolved with (`nil` for `null` or `undefined`),
 *  or with an error when the task cannot run, throws, is not defined, is unregistered while it runs,
 *  or does not finish within `timeout` seconds.
 */
- (void)runTaskWithName:(NSString *)taskName
                   data:(NSDictionary *)data
                timeout:(NSTimeInterval)timeout
      completionHandler:(void (^NS_SWIFT_SENDABLE)(id _Nullable_result result, NSError *_Nullable error))completionHandler;

@end

NS_ASSUME_NONNULL_END
