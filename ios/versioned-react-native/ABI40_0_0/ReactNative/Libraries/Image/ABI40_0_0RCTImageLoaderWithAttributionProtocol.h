/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI40_0_0React/ABI40_0_0RCTImageLoaderProtocol.h>
#import <ABI40_0_0React/ABI40_0_0RCTImageURLLoaderWithAttribution.h>

ABI40_0_0RCT_EXTERN BOOL ABI40_0_0RCTImageLoadingInstrumentationEnabled(void);
ABI40_0_0RCT_EXTERN BOOL ABI40_0_0RCTImageLoadingPerfInstrumentationEnabled(void);
ABI40_0_0RCT_EXTERN void ABI40_0_0RCTEnableImageLoadingInstrumentation(BOOL enabled);
ABI40_0_0RCT_EXTERN void ABI40_0_0RCTEnableImageLoadingPerfInstrumentation(BOOL enabled);

@protocol ABI40_0_0RCTImageLoaderWithAttributionProtocol<ABI40_0_0RCTImageLoaderProtocol>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the variant in ABI40_0_0RCTImageURLLoaderProtocol, but allows passing attribution
 * information that each image URL loader can process.
 */
- (ABI40_0_0RCTImageURLLoaderRequest *)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                 size:(CGSize)size
                                                scale:(CGFloat)scale
                                              clipped:(BOOL)clipped
                                           resizeMode:(ABI40_0_0RCTResizeMode)resizeMode
                                          attribution:(const ABI40_0_0facebook::ABI40_0_0React::ImageURLLoaderAttribution &)attribution
                                        progressBlock:(ABI40_0_0RCTImageLoaderProgressBlock)progressBlock
                                     partialLoadBlock:(ABI40_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                      completionBlock:(ABI40_0_0RCTImageLoaderCompletionBlock)completionBlock;
#endif

/**
 * Image instrumentation - notify that the image content (UIImage) has been set on the native view.
 */
- (void)trackURLImageContentDidSetForRequest:(ABI40_0_0RCTImageURLLoaderRequest *)loaderRequest;

/**
 * Image instrumentation - start tracking the on-screen visibility of the native image view.
 */
- (void)trackURLImageVisibilityForRequest:(ABI40_0_0RCTImageURLLoaderRequest *)loaderRequest imageView:(UIView *)imageView;

/**
 * Image instrumentation - notify that the native image view was destroyed.
 */
- (void)trackURLImageDidDestroy:(ABI40_0_0RCTImageURLLoaderRequest *)loaderRequest;

@end
