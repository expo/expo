/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI39_0_0React/ABI39_0_0RCTImageLoaderProtocol.h>
#import <ABI39_0_0React/ABI39_0_0RCTImageURLLoaderWithAttribution.h>

ABI39_0_0RCT_EXTERN BOOL ABI39_0_0RCTImageLoadingInstrumentationEnabled(void);
ABI39_0_0RCT_EXTERN BOOL ABI39_0_0RCTImageLoadingPerfInstrumentationEnabled(void);
ABI39_0_0RCT_EXTERN void ABI39_0_0RCTEnableImageLoadingInstrumentation(BOOL enabled);
ABI39_0_0RCT_EXTERN void ABI39_0_0RCTEnableImageLoadingPerfInstrumentation(BOOL enabled);

@protocol ABI39_0_0RCTImageLoaderWithAttributionProtocol<ABI39_0_0RCTImageLoaderProtocol>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the variant in ABI39_0_0RCTImageURLLoaderProtocol, but allows passing attribution
 * information that each image URL loader can process.
 */
- (ABI39_0_0RCTImageURLLoaderRequest *)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                 size:(CGSize)size
                                                scale:(CGFloat)scale
                                              clipped:(BOOL)clipped
                                           resizeMode:(ABI39_0_0RCTResizeMode)resizeMode
                                          attribution:(const ABI39_0_0facebook::ABI39_0_0React::ImageURLLoaderAttribution &)attribution
                                        progressBlock:(ABI39_0_0RCTImageLoaderProgressBlock)progressBlock
                                     partialLoadBlock:(ABI39_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                      completionBlock:(ABI39_0_0RCTImageLoaderCompletionBlock)completionBlock;
#endif

/**
 * Image instrumentation - notify that the image content (UIImage) has been set on the native view.
 */
- (void)trackURLImageContentDidSetForRequest:(ABI39_0_0RCTImageURLLoaderRequest *)loaderRequest;

/**
 * Image instrumentation - start tracking the on-screen visibility of the native image view.
 */
- (void)trackURLImageVisibilityForRequest:(ABI39_0_0RCTImageURLLoaderRequest *)loaderRequest imageView:(UIView *)imageView;

/**
 * Image instrumentation - notify that the native image view was destroyed.
 */
- (void)trackURLImageDidDestroy:(ABI39_0_0RCTImageURLLoaderRequest *)loaderRequest;

@end
