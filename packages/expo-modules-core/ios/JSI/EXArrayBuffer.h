// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus
#import <jsi/jsi.h>
#import <ExpoModulesJSI/MemoryBuffer.h>
#endif

/**
 * A reference-counting wrapper around ArrayBuffer memory to manage lifetime.
 * Used to ensure ArrayBuffer memory remains valid when shared between
 * Swift Data objects and the underlying buffer.
 */
@interface EXArrayBufferStrongRef : NSObject

#ifdef __cplusplus
- (nonnull instancetype)initWith:(std::shared_ptr<expo::MemoryBuffer>)ptr;
#endif

/**
 * Releases the strong reference to the underlying memory buffer.
 * After calling this method, the memory may be deallocated.
 */
- (void)reset;
@end

/**
 * Protocol defining the interface for raw ArrayBuffer implementations.
 * Provides access to the underlying memory and size information.
 */
NS_SWIFT_NAME(RawArrayBuffer)
@protocol EXArrayBuffer

- (size_t)getSize;

- (nonnull void *)getUnsafeMutableRawPointer;

/**
 * Returns a strong reference to the underlying memory buffer, or nil if not applicable.
 * Used to prevent deallocation when the memory is shared with other objects.
 */
- (EXArrayBufferStrongRef *_Nullable)memoryStrongRef;

@end


