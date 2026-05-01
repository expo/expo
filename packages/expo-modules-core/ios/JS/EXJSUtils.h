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

@end
