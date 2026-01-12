// Copyright 2025-present 650 Industries. All rights reserved.

@class EXAppContext;
@class EXRuntime;
@class EXJavaScriptValue;
@class EXJavaScriptRuntime;

@interface WorkletRuntimeFactory : NSObject

+ (nonnull EXRuntime *)createWorkletRuntime:(nonnull EXAppContext *)appContext fromPointer:(nullable void *)pointer;

+ (nullable void *)extractRuntimePointer:(nonnull EXJavaScriptValue *)jsValue runtime:(nonnull EXJavaScriptRuntime *)runtime;

@end
