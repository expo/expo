/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTImageLoaderProtocol.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageURLLoaderWithAttribution.h>

ABI48_0_0RCT_EXTERN BOOL ABI48_0_0RCTImageLoadingPerfInstrumentationEnabled(void);
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTEnableImageLoadingPerfInstrumentation(BOOL enabled);

@protocol ABI48_0_0RCTImageLoaderWithAttributionProtocol <ABI48_0_0RCTImageLoaderProtocol, ABI48_0_0RCTImageLoaderLoggableProtocol>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the variant in ABI48_0_0RCTImageURLLoaderProtocol, but allows passing attribution
 * information that each image URL loader can process.
 */
- (ABI48_0_0RCTImageURLLoaderRequest *)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                 size:(CGSize)size
                                                scale:(CGFloat)scale
                                              clipped:(BOOL)clipped
                                           resizeMode:(ABI48_0_0RCTResizeMode)resizeMode
                                             priority:(ABI48_0_0RCTImageLoaderPriority)priority
                                          attribution:(const ABI48_0_0facebook::ABI48_0_0React::ImageURLLoaderAttribution &)attribution
                                        progressBlock:(ABI48_0_0RCTImageLoaderProgressBlock)progressBlock
                                     partialLoadBlock:(ABI48_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                      completionBlock:(ABI48_0_0RCTImageLoaderCompletionBlockWithMetadata)completionBlock;
#endif

/**
 * Image instrumentation - start tracking the on-screen visibility of the native image view.
 */
- (void)trackURLImageVisibilityForRequest:(ABI48_0_0RCTImageURLLoaderRequest *)loaderRequest imageView:(UIView *)imageView;

/**
 * Image instrumentation - notify that the request was cancelled.
 */
- (void)trackURLImageRequestDidDestroy:(ABI48_0_0RCTImageURLLoaderRequest *)loaderRequest;

/**
 * Image instrumentation - notify that the native image view was destroyed.
 */
- (void)trackURLImageDidDestroy:(ABI48_0_0RCTImageURLLoaderRequest *)loaderRequest;

@end
