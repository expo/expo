// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXJavaScriptValue;
@class EXJavaScriptRuntime;

/**
 Protocol for installing a secondary JavaScript runtime (typically the
 Worklets UI runtime) into an `AppContext`. Register a conforming
 instance via `AppContext.uiRuntimeFactory`. `ExpoModulesWorklets`
 provides one automatically when `react-native-worklets` is installed.

 ## Why this is declared in Objective-C

 When `ExpoModulesCore` ships as a precompiled xcframework, its Swift
 module is published as a `.swiftinterface` file that consumers re-parse
 to rebuild the `AppContext` member table. Swift 6.3 has a race in that
 rebuild: members whose signature mentions `NS_SWIFT_NAME`-bridged ObjC
 types (`JavaScriptValue`, `JavaScriptRuntime`, etc. from the
 `ExpoModulesCore.ExpoModulesJSI` submodule) may be walked before the
 submodule has materialized those aliases. When the type lookup fails,
 **the whole member is dropped silently** — the consumer then sees
 "type 'AppContext' has no member 'uiRuntimeFactory'" even though the
 declaration is right there in the interface file.

 Routing the hook through an `@objc` protocol declared in an ObjC
 header sidesteps the bug: clang's module bridge resolves the protocol
 before Swift walks `AppContext`'s member table, the stored-property
 type (`(any WorkletsUIRuntimeFactory)?`) doesn't itself mention any
 `NS_SWIFT_NAME`-bridged type, and the JSI types only appear inside the
 protocol's method signature (which isn't part of the `AppContext`
 member-table lookup).

 This is the canonical explanation of the workaround. Other references
 to it (see `EXAppContextProtocol.h`, `AppContext.swift`) point here.
 */
NS_SWIFT_NAME(WorkletsUIRuntimeFactory)
@protocol EXWorkletsUIRuntimeFactory <NSObject>

- (nullable EXJavaScriptRuntime *)createUIRuntimeWithPointerValue:(nonnull EXJavaScriptValue *)pointerValue
                                                          runtime:(nonnull EXJavaScriptRuntime *)runtime
                                                            error:(NSError * _Nullable * _Nullable)error
    NS_SWIFT_NAME(createUIRuntime(pointerValue:runtime:));

@end
