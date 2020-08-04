/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTImageURLLoader.h>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

struct ImageURLLoaderAttribution {
  int32_t nativeViewTag = 0;
  int32_t surfaceId = 0;
};

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
#endif

/**
 * Same as the ABI38_0_0RCTImageURLLoader interface, but allows passing in optional `attribution` information.
 * This is useful for per-app logging and other instrumentation.
 */
@protocol ABI38_0_0RCTImageURLLoaderWithAttribution <ABI38_0_0RCTImageURLLoader>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the ABI38_0_0RCTImageURLLoader variant above, but allows optional `attribution` information.
 */
- (ABI38_0_0RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI38_0_0RCTResizeMode)resizeMode
                                       attribution:(const ABI38_0_0facebook::ABI38_0_0React::ImageURLLoaderAttribution &)attribution
                                   progressHandler:(ABI38_0_0RCTImageLoaderProgressBlock)progressHandler
                                partialLoadHandler:(ABI38_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                 completionHandler:(ABI38_0_0RCTImageLoaderCompletionBlock)completionHandler;
#endif

@end
