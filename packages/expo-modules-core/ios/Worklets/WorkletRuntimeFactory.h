// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXJavaScriptValue.h>
#import <ExpoModulesWorklets/EXWorkletRuntime.h>

@class EXAppContext;

@interface WorkletRuntimeFactory : NSObject

+ (nonnull EXWorkletRuntime *)createWorkletRuntime:(nonnull EXAppContext *)appContext fromPointer:(nullable void *)pointer;

+ (nullable void *)extractRuntimePointer:(nonnull EXJavaScriptValue *)jsValue runtime:(nonnull EXJavaScriptRuntime *)runtime;

@end
