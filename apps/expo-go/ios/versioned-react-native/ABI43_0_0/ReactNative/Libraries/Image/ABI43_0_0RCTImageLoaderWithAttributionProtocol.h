/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTImageLoaderProtocol.h>
#import <ABI43_0_0React/ABI43_0_0RCTImageURLLoaderWithAttribution.h>

ABI43_0_0RCT_EXTERN BOOL ABI43_0_0RCTImageLoadingInstrumentationEnabled(void);
ABI43_0_0RCT_EXTERN BOOL ABI43_0_0RCTImageLoadingPerfInstrumentationEnabled(void);
ABI43_0_0RCT_EXTERN void ABI43_0_0RCTEnableImageLoadingInstrumentation(BOOL enabled);
ABI43_0_0RCT_EXTERN void ABI43_0_0RCTEnableImageLoadingPerfInstrumentation(BOOL enabled);

ABI43_0_0RCT_EXTERN BOOL ABI43_0_0RCTGetImageLoadingPerfInstrumentationForFabricEnabled();
ABI43_0_0RCT_EXTERN void ABI43_0_0RCTSetImageLoadingPerfInstrumentationForFabricEnabledBlock(BOOL (^getEnabled)());

@protocol ABI43_0_0RCTImageLoaderWithAttributionProtocol<ABI43_0_0RCTImageLoaderProtocol, ABI43_0_0RCTImageLoaderLoggableProtocol>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the variant in ABI43_0_0RCTImageURLLoaderProtocol, but allows passing attribution
 * information that each image URL loader can process.
 */
- (ABI43_0_0RCTImageURLLoaderRequest *)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                 size:(CGSize)size
                                                scale:(CGFloat)scale
                                              clipped:(BOOL)clipped
                                           resizeMode:(ABI43_0_0RCTResizeMode)resizeMode
                                             priority: (ABI43_0_0RCTImageLoaderPriority)priority
                                          attribution:(const ABI43_0_0facebook::ABI43_0_0React::ImageURLLoaderAttribution &)attribution
                                        progressBlock:(ABI43_0_0RCTImageLoaderProgressBlock)progressBlock
                                     partialLoadBlock:(ABI43_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                      completionBlock:(ABI43_0_0RCTImageLoaderCompletionBlockWithMetadata)completionBlock;
#endif

/**
 * Image instrumentation - start tracking the on-screen visibility of the native image view.
 */
- (void)trackURLImageVisibilityForRequest:(ABI43_0_0RCTImageURLLoaderRequest *)loaderRequest imageView:(UIView *)imageView;

/**
 * Image instrumentation - notify that the request was cancelled.
 */
- (void)trackURLImageRequestDidDestroy:(ABI43_0_0RCTImageURLLoaderRequest *)loaderRequest;

/**
 * Image instrumentation - notify that the native image view was destroyed.
 */
- (void)trackURLImageDidDestroy:(ABI43_0_0RCTImageURLLoaderRequest *)loaderRequest;

@end
