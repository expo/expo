// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXJavaScriptValue;
@class EXJavaScriptRuntime;
@class EXJavaScriptSerializable;

NS_SWIFT_NAME(SerializableExtractor)
@interface EXSerializableExtractor : NSObject

/**
 Checks if the given JavaScript value is a Serializable reference.
 */
+ (BOOL)isSerializable:(nonnull EXJavaScriptValue *)value
               runtime:(nonnull EXJavaScriptRuntime *)runtime;

/**
 Extracts the Serializable from the given JavaScript value.
 Returns nil if the value is not a Serializable reference.
 */
+ (nullable EXJavaScriptSerializable *)extractSerializable:(nonnull EXJavaScriptValue *)value
                                                   runtime:(nonnull EXJavaScriptRuntime *)runtime;

@end
