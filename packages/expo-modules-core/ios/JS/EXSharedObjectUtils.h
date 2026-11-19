// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

typedef void (^ObjectReleaser)(long objectId);

NS_ASSUME_NONNULL_BEGIN

/**
 A weak reference to the listeners in an `expo::SharedObject::NativeState`.
 */
NS_SWIFT_NAME(SharedObjectListeners)
@interface EXSharedObjectListeners : NSObject

/**
 Removes all listeners of the native state, if the native state still exists. Call it on the JavaScript thread
 of the runtime that the listeners belong to.
 */
- (void)clear;

@end

/**
 Bridges Swift to `expo::SharedObject::NativeState` (which inherits from
 `expo::EventEmitter::NativeState`), so that later `addListener` calls on
 the same JS object find the existing state instead of overwriting it.
 */
NS_SWIFT_NAME(SharedObjectUtils)
@interface EXSharedObjectUtils : NSObject

/**
 Builds an `expo::SharedObject::NativeState` for the given `objectId` and returns
 a heap-allocated `expo::NativeStateShared` (`std::shared_ptr<jsi::NativeState>`)
 that owns it. The caller transfers ownership of the returned pointer to Swift via
 `JavaScriptNativeState(adoptingFactory:)`, which consumes the heap allocation.

 The `context` and `contextDeallocator` are forwarded to `expo::NativeState` so
 the JS-side `getNativeState` can later round-trip back to the Swift wrapper.
 `listeners` gets a weak reference to the listeners of the new native state.
 */
+ (nonnull void *)makeSharedObjectNativeStatePtr:(long)objectId
                                        releaser:(nonnull ObjectReleaser)releaser
                                       listeners:(nonnull EXSharedObjectListeners *)listeners
                                         context:(nullable void *)context
                              contextDeallocator:(nullable void (*)(void * _Nullable))contextDeallocator
    NS_SWIFT_NAME(makeSharedObjectNativeStatePtr(objectId:releaser:listeners:context:contextDeallocator:));

@end

NS_ASSUME_NONNULL_END
