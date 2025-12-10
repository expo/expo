// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesJSI/EXJavaScriptObject.h>
#import <ExpoModulesJSI/EXJavaScriptRuntime.h>

@interface EXArrayBufferStrongRef : NSObject
- (void)reset;
@end

NS_SWIFT_NAME(RawArrayBuffer)
@protocol EXArrayBuffer

- (size_t)getSize;

- (nonnull void *)getUnsafeMutableRawPointer;

- (EXArrayBufferStrongRef *_Nullable)memoryStrongRef;

@end

NS_SWIFT_NAME(RawNativeArrayBuffer)
@interface EXNativeArrayBuffer : NSObject<EXArrayBuffer>

- (nonnull instancetype)initWithData:(uint8_t*_Nonnull)data
                                size:(size_t)size
                             cleanup:(void (^_Nonnull)(void))cleanup
NS_SWIFT_NAME(init(data:size:cleanup:));


#ifdef __cplusplus
/**
 Returns a shared pointer to the underlying memory.
 */
- (std::shared_ptr<jsi::MutableBuffer>)jsiBuffer;
#endif

@end

NS_SWIFT_NAME(RawJavaScriptArrayBuffer)
@interface EXJavaScriptArrayBuffer : EXJavaScriptObject<EXArrayBuffer>

#ifdef __cplusplus
- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(EXJavaScriptRuntime *_Nonnull)runtime;
#endif

@end

