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

@end

NS_ASSUME_NONNULL_END
