// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXJavaScriptSerializable;

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(SerializableExtractor)
@interface EXSerializableExtractor : NSObject

/**
 Checks if the given JavaScript value is a Serializable reference.
 @param runtimePointer Raw pointer to the `jsi::Runtime`.
 @param valuePointer Raw pointer to the `jsi::Value`.
 */
+ (BOOL)isSerializableWithRuntimePointer:(void *)runtimePointer
                            valuePointer:(const void *)valuePointer
    NS_SWIFT_NAME(isSerializable(runtimePointer:valuePointer:));

/**
 Extracts the Serializable from the given JavaScript value.
 Returns nil if the value is not a Serializable reference.
 @param runtimePointer Raw pointer to the `jsi::Runtime`.
 @param valuePointer Raw pointer to the `jsi::Value`.
 */
+ (nullable EXJavaScriptSerializable *)extractSerializableWithRuntimePointer:(void *)runtimePointer
                                                                valuePointer:(const void *)valuePointer
    NS_SWIFT_NAME(extractSerializable(runtimePointer:valuePointer:));

@end

NS_ASSUME_NONNULL_END
