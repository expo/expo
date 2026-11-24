// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXJavaScriptSerializable;

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(WorkletRuntimeHandle)
@interface EXWorkletRuntimeHandle : NSObject

/**
 Creates a handle from a raw `jsi::Runtime*` pointer.
 Internally extracts the `weak_ptr<WorkletRuntime>` from it.
 Returns nil if the pointer doesn't correspond to a valid worklet runtime.
 */
- (nullable instancetype)initWithRawPointer:(void *)pointer NS_SWIFT_NAME(init(rawPointer:));

/**
 Creates a handle to the worklet runtime of a holder of `react-native-worklets`, which belongs to the runtime at
 `runtimePointer`. Unlike `init(rawPointer:)`, it makes JSI calls only on that runtime, so it doesn't wait for the lock
 of the worklet runtime. Returns nil when the holder has no worklet runtime.
 */
- (nullable instancetype)initWithRuntimePointer:(void *)runtimePointer
                                  holderPointer:(const void *)holderPointer
    NS_SWIFT_NAME(init(runtimePointer:holderPointer:));

- (instancetype)init NS_UNAVAILABLE;

/**
 Schedules async worklet execution with arguments.
 */
- (void)scheduleWorklet:(EXJavaScriptSerializable *)serializable
              arguments:(NSArray *)arguments;

/**
 Executes worklet synchronously with arguments.
 */
- (void)executeWorklet:(EXJavaScriptSerializable *)serializable
             arguments:(NSArray *)arguments;

/**
 Runs `block` on the calling thread with the raw `jsi::Runtime *` of the worklet runtime, while holding its lock, and
 returns YES. Returns NO without running `block` when the runtime is gone.
 */
- (BOOL)runSync:(NS_NOESCAPE void (^)(void *runtimePointer))block NS_SWIFT_NAME(runSync(_:));

/**
 Runs `block` with the raw `jsi::Runtime *` of the worklet runtime, which stays alive while `block` runs, and returns
 YES. Returns NO without running `block` when the runtime is gone.
 */
- (BOOL)withRuntimePointer:(NS_NOESCAPE void (^)(void *runtimePointer))block NS_SWIFT_NAME(withRuntimePointer(_:));

@end

NS_ASSUME_NONNULL_END
