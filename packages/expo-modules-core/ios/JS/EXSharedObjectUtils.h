// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

typedef void (^ObjectReleaser)(long objectId);

NS_ASSUME_NONNULL_BEGIN

/**
 Bridges Swift to `expo::SharedObject::NativeState` (which inherits from
 `expo::EventEmitter::NativeState`), so that later `addListener` calls on
 the same JS object find the existing state instead of overwriting it.

 TODO: remove once `EventEmitter`'s native state is migrated onto the Swift
 `JavaScriptNativeState` / `expo::NativeState` system.
 */
NS_SWIFT_NAME(SharedObjectUtils)
@interface EXSharedObjectUtils : NSObject

+ (void)setNativeState:(nonnull void *)runtimePointer
          valuePointer:(nonnull void *)valuePointer
              objectId:(long)objectId
              releaser:(nonnull ObjectReleaser)releaser
    NS_SWIFT_NAME(setNativeState(runtimePointer:valuePointer:objectId:releaser:));

@end

NS_ASSUME_NONNULL_END
