// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_SWIFT_NAME(JSUtils)
@interface EXJSUtils : NSObject

/**
 Emits an event with the given name and arguments on the specified JS object.
 The runtimePointer is a raw pointer to `facebook::jsi::Runtime`.
 The objectPointer is a raw pointer to `facebook::jsi::Value` representing the target JS object.
 */
+ (void)emitEvent:(nonnull NSString *)eventName
   runtimePointer:(nonnull void *)runtimePointer
    objectPointer:(nonnull const void *)objectPointer
    withArguments:(nonnull NSArray<id> *)arguments;

/**
 Same as above but takes a raw `facebook::jsi::Value` pointer and count.
 */
+ (void)emitEvent:(nonnull NSString *)eventName
   runtimePointer:(nonnull void *)runtimePointer
    objectPointer:(nonnull const void *)objectPointer
 argumentsPointer:(nullable const void *)argumentsPointer
    argumentCount:(NSUInteger)argumentCount;

@end
