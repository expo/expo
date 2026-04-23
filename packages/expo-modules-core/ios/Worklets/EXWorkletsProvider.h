// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXJavaScriptValue;
@class EXJavaScriptRuntime;
@class EXJavaScriptSerializable;
@class EXWorkletRuntime;

/**
 Contract fulfilled by `ExpoModulesWorkletsAdapter` when
 `react-native-worklets` is installed. Discovered at runtime via
 `NSClassFromString("ExpoWorkletsBridgeProvider")` — this pod never
 references `worklets::*` C++ symbols directly, which lets it ship as a
 precompiled xcframework.

 Declared in Objective-C (rather than Swift) so the adapter's Obj-C++
 translation units can import it from a sibling pod — Swift-generated
 `-Swift.h` headers aren't copied into CocoaPods' public Headers
 directory and wouldn't be visible across the pod boundary.
 */
NS_SWIFT_NAME(ExpoWorkletsProvider)
@protocol EXWorkletsProvider <NSObject>

- (nullable EXJavaScriptSerializable *)extractSerializableFrom:(nonnull EXJavaScriptValue *)value
                                                        runtime:(nonnull EXJavaScriptRuntime *)runtime
    NS_SWIFT_NAME(extractSerializable(from:runtime:));

- (nullable EXWorkletRuntime *)createWorkletRuntimeFromValue:(nonnull EXJavaScriptValue *)jsValue
                                                      runtime:(nonnull EXJavaScriptRuntime *)runtime
    NS_SWIFT_NAME(createWorkletRuntime(from:runtime:));

- (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
         runtime:(nonnull EXWorkletRuntime *)runtime;

- (void)execute:(nonnull EXJavaScriptSerializable *)serializable
        runtime:(nonnull EXWorkletRuntime *)runtime;

- (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
         runtime:(nonnull EXWorkletRuntime *)runtime
       arguments:(nonnull NSArray *)arguments;

- (void)execute:(nonnull EXJavaScriptSerializable *)serializable
        runtime:(nonnull EXWorkletRuntime *)runtime
      arguments:(nonnull NSArray *)arguments;

@end
