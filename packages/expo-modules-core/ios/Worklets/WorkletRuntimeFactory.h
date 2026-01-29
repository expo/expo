// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppContextProtocol.h>
#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesJSI/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXWorkletRuntime.h>

@class EXAppContext;

@interface WorkletRuntimeFactory : NSObject

+ (nonnull EXWorkletRuntime *)createWorkletRuntime:(nonnull id<EXAppContextProtocol>)appContext fromPointer:(nullable void *)pointer;

+ (nullable void *)extractRuntimePointer:(nonnull EXJavaScriptValue *)jsValue runtime:(nonnull EXJavaScriptRuntime *)runtime;

@end
