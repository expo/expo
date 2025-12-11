// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesJSI/EXJavaScriptObject.h>
#import <ExpoModulesJSI/EXJavaScriptRuntime.h>

/**
 * A reference-counting wrapper around ArrayBuffer memory to manage lifetime.
 * Used to ensure ArrayBuffer memory remains valid when shared between
 * Swift Data objects and the underlying buffer.
 */
@interface EXArrayBufferStrongRef : NSObject
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

/**
 * Native ArrayBuffer implementation that manages its own memory allocation.
 * This is used for ArrayBuffers created from native code that own their memory.
 */
NS_SWIFT_NAME(RawNativeArrayBuffer)
@interface EXNativeArrayBuffer : NSObject<EXArrayBuffer>

- (nonnull instancetype)initWithData:(uint8_t*_Nonnull)data
                                size:(size_t)size
                             cleanup:(void (^_Nonnull)(void))cleanup
NS_SWIFT_NAME(init(data:size:cleanup:));


#ifdef __cplusplus
/**
 Returns a shared pointer to the underlying memory that can be used to create a JSI ArrayBuffer.
 */
- (std::shared_ptr<jsi::MutableBuffer>)jsiBuffer;
#endif

@end

/**
 * JavaScript ArrayBuffer implementation that wraps a JSI ArrayBuffer.
 * This provides access to ArrayBuffers created in JavaScript from native code.
 */
NS_SWIFT_NAME(RawJavaScriptArrayBuffer)
@interface EXJavaScriptArrayBuffer : EXJavaScriptObject<EXArrayBuffer>

#ifdef __cplusplus
- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(EXJavaScriptRuntime *_Nonnull)runtime;
#endif

@end

