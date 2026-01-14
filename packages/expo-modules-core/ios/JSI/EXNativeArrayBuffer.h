// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus
#import <jsi/jsi.h>

namespace jsi = facebook::jsi;
#endif // __cplusplus

#import <ExpoModulesJSI/EXArrayBuffer.h>

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
