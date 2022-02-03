/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTImageLoaderProtocol.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageURLLoaderWithAttribution.h>

ABI42_0_0RCT_EXTERN BOOL ABI42_0_0RCTImageLoadingInstrumentationEnabled(void);
ABI42_0_0RCT_EXTERN BOOL ABI42_0_0RCTImageLoadingPerfInstrumentationEnabled(void);
ABI42_0_0RCT_EXTERN void ABI42_0_0RCTEnableImageLoadingInstrumentation(BOOL enabled);
ABI42_0_0RCT_EXTERN void ABI42_0_0RCTEnableImageLoadingPerfInstrumentation(BOOL enabled);

@protocol ABI42_0_0RCTImageLoaderWithAttributionProtocol<ABI42_0_0RCTImageLoaderProtocol>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the variant in ABI42_0_0RCTImageURLLoaderProtocol, but allows passing attribution
 * information that each image URL loader can process.
 */
- (ABI42_0_0RCTImageURLLoaderRequest *)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                 size:(CGSize)size
                                                scale:(CGFloat)scale
                                              clipped:(BOOL)clipped
                                           resizeMode:(ABI42_0_0RCTResizeMode)resizeMode
                                          attribution:(const ABI42_0_0facebook::ABI42_0_0React::ImageURLLoaderAttribution &)attribution
                                        progressBlock:(ABI42_0_0RCTImageLoaderProgressBlock)progressBlock
                                     partialLoadBlock:(ABI42_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                      completionBlock:(ABI42_0_0RCTImageLoaderCompletionBlock)completionBlock;
#endif

/**
 * Image instrumentation - notify that the image content (UIImage) has been set on the native view.
 */
- (void)trackURLImageContentDidSetForRequest:(ABI42_0_0RCTImageURLLoaderRequest *)loaderRequest;

/**
 * Image instrumentation - start tracking the on-screen visibility of the native image view.
 */
- (void)trackURLImageVisibilityForRequest:(ABI42_0_0RCTImageURLLoaderRequest *)loaderRequest imageView:(UIView *)imageView;

/**
 * Image instrumentation - notify that the native image view was destroyed.
 */
- (void)trackURLImageDidDestroy:(ABI42_0_0RCTImageURLLoaderRequest *)loaderRequest;

@end
