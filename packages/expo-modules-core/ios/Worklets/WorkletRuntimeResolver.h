// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(WorkletRuntimeResolver)
@interface EXWorkletRuntimeResolver : NSObject

/**
 Resolves the raw `jsi::Runtime *` of the UI worklet runtime from a
 `react-native-worklets` UI runtime holder.
 @param runtimePointer Raw pointer to the RN `jsi::Runtime`.
 @param holderPointer Raw pointer to the holder `jsi::Value`.
 Returns NULL when the runtime can't be resolved.
 */
+ (void * _Nullable)uiRuntimePointerWithRuntimePointer:(void *)runtimePointer
                                         holderPointer:(const void *)holderPointer
    NS_SWIFT_NAME(uiRuntimePointer(runtimePointer:holderPointer:));

@end

NS_ASSUME_NONNULL_END
