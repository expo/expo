// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXJavaScriptValue.h>
#import <ExpoModulesWorklets/EXWorkletRuntime.h>

@interface WorkletRuntimeFactory : NSObject

+ (nonnull EXWorkletRuntime *)createWorkletRuntimeFromPointer:(nullable void *)pointer;

+ (nullable void *)extractRuntimePointer:(nonnull EXJavaScriptValue *)jsValue runtime:(nonnull EXJavaScriptRuntime *)runtime;

@end
