/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTImageLoaderProtocol.h>
#import <ABI38_0_0React/ABI38_0_0RCTImageURLLoaderWithAttribution.h>

@protocol ABI38_0_0RCTImageLoaderWithAttributionProtocol<ABI38_0_0RCTImageLoaderProtocol>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the variant in ABI38_0_0RCTImageURLLoaderProtocol, but allows passing attribution
 * information that each image URL loader can process.
 */
- (ABI38_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                      size:(CGSize)size
                                                     scale:(CGFloat)scale
                                                   clipped:(BOOL)clipped
                                                resizeMode:(ABI38_0_0RCTResizeMode)resizeMode
                                               attribution:(const ABI38_0_0facebook::ABI38_0_0React::ImageURLLoaderAttribution &)attribution
                                             progressBlock:(ABI38_0_0RCTImageLoaderProgressBlock)progressBlock
                                          partialLoadBlock:(ABI38_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                           completionBlock:(ABI38_0_0RCTImageLoaderCompletionBlock)completionBlock;
#endif

@end
