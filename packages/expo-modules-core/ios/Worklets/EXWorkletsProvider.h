// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>

NS_ASSUME_NONNULL_BEGIN

// Bridge contract implemented by `ExpoModulesWorkletsAdapter` (the source-only
// companion pod that links against `react-native-worklets`). The main
// `ExpoModulesWorklets` pod is built without any `worklets::*` references so
// it can ship as a precompiled xcframework; at runtime it discovers the
// adapter via `EXWorkletsProviderRegistry.shared` and forwards through this
// protocol. When the adapter isn't linked the registry stays nil.
NS_SWIFT_NAME(WorkletsProvider)
@protocol EXWorkletsProvider <NSObject>

- (BOOL)isSerializableWithRuntimePointer:(void *)runtimePointer
                            valuePointer:(const void *)valuePointer
    NS_SWIFT_NAME(isSerializable(runtimePointer:valuePointer:));

- (nullable EXJavaScriptSerializable *)extractSerializableWithRuntimePointer:(void *)runtimePointer
                                                                valuePointer:(const void *)valuePointer
    NS_SWIFT_NAME(extractSerializable(runtimePointer:valuePointer:));

- (nullable id)workletRuntimeHandleForRawPointer:(void *)rawPointer
    NS_SWIFT_NAME(workletRuntimeHandle(rawPointer:));

- (void * _Nullable)uiRuntimePointerWithRuntimePointer:(void *)runtimePointer
                                         holderPointer:(const void *)holderPointer
    NS_SWIFT_NAME(uiRuntimePointer(runtimePointer:holderPointer:));

// Returns an opaque scheduler handle for the worklet runtime with the given `jsi::Runtime` pointer and sets
// `dispatch` to a `void (*)(void *scheduler, int priority, void (^callback)())` function that runs the callback
// on the thread of that runtime. Both go to `JavaScriptRuntime.init(unsafePointer:scheduler:dispatch:)`. The
// handle stays valid for the lifetime of the process. Returns NULL when the pointer isn't a live worklet runtime.
- (void * _Nullable)schedulerWithRuntimePointer:(void *)runtimePointer
                                       dispatch:(const void * _Nullable * _Nonnull)dispatch
    NS_SWIFT_NAME(scheduler(runtimePointer:dispatch:));

- (void)scheduleWorkletWithRuntimeHandle:(id)runtimeHandle
                            serializable:(EXJavaScriptSerializable *)serializable
                               arguments:(NSArray *)arguments
    NS_SWIFT_NAME(scheduleWorklet(runtimeHandle:serializable:arguments:));

- (void)executeWorkletWithRuntimeHandle:(id)runtimeHandle
                           serializable:(EXJavaScriptSerializable *)serializable
                              arguments:(NSArray *)arguments
    NS_SWIFT_NAME(executeWorklet(runtimeHandle:serializable:arguments:));

@end

// The adapter pod registers its provider in `+load`; the main pod's runtime
// APIs read it lazily and degrade gracefully when nil. The setter is
// declared in `EXWorkletsProvider+Private.h` so only the adapter can
// publish a provider — preventing accidental clobbering from app code.
NS_SWIFT_NAME(WorkletsProviderRegistry)
@interface EXWorkletsProviderRegistry : NSObject

@property (class, atomic, readonly, nullable) id<EXWorkletsProvider> shared;

@end

NS_ASSUME_NONNULL_END
