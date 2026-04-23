// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Resolve the base class across both source-pod and precompiled-xcframework
// layouts: in source builds `ExpoModulesJSI` is its own pod and the top-level
// include path works; in the precompiled `ExpoModulesCore.xcframework` the
// JSI headers are nested as `ExpoModulesCore.framework/Headers/ExpoModulesJSI/…`.
#if __has_include(<ExpoModulesJSI/EXJavaScriptRuntime.h>)
#import <ExpoModulesJSI/EXJavaScriptRuntime.h>
#elif __has_include(<ExpoModulesCore/ExpoModulesJSI/EXJavaScriptRuntime.h>)
#import <ExpoModulesCore/ExpoModulesJSI/EXJavaScriptRuntime.h>
#endif

/**
 Marker subclass of `EXJavaScriptRuntime`. No `worklets::*` types appear
 in this header so the class can live in a precompilable xcframework.
 The adapter instantiates it via the base class's
 `initWithRuntime:callInvoker:` and looks up the underlying
 `worklets::WorkletRuntime` through `jsi::Runtime *` on demand.
 */
NS_SWIFT_NAME(WorkletRuntime)
@interface EXWorkletRuntime : EXJavaScriptRuntime
@end
