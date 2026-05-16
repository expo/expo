// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Bridges optimized function calls from Swift to C++/JSI.
 Uses NSInvocation with ObjC type encoding to call `@convention(block)` closures
 directly from jsi::Value arguments, bypassing JavaScriptValue boxing.
 */
NS_SWIFT_NAME(OptimizedFunctionUtils)
@interface EXOptimizedFunctionUtils : NSObject

/**
 Creates a sync optimized JSI host function and moves it into the object at `objectPointer`.
 The object pointer must point to a valid `jsi::Object` whose contents will be replaced.
 */
+ (void)createSyncFunction:(nonnull NSString *)name
              intoObject:(nonnull void *)objectPointer
          runtimePointer:(nonnull void *)runtimePointer
            typeEncoding:(nonnull NSString *)typeEncoding
               argsCount:(NSInteger)argsCount
                   block:(nonnull id)block
    NS_SWIFT_NAME(createSyncFunction(name:intoObject:runtimePointer:typeEncoding:argsCount:block:));

/**
 Creates an async optimized JSI host function and moves it into the object at `objectPointer`.
 The object pointer must point to a valid `jsi::Object` whose contents will be replaced.
 */
+ (void)createAsyncFunction:(nonnull NSString *)name
               intoObject:(nonnull void *)objectPointer
           runtimePointer:(nonnull void *)runtimePointer
             typeEncoding:(nonnull NSString *)typeEncoding
                argsCount:(NSInteger)argsCount
                    block:(nonnull id)block
    NS_SWIFT_NAME(createAsyncFunction(name:intoObject:runtimePointer:typeEncoding:argsCount:block:));

@end

NS_ASSUME_NONNULL_END
