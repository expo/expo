/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTImageLoaderProtocol.h>
#import <ABI44_0_0React/ABI44_0_0RCTImageURLLoaderWithAttribution.h>

ABI44_0_0RCT_EXTERN BOOL ABI44_0_0RCTImageLoadingInstrumentationEnabled(void);
ABI44_0_0RCT_EXTERN BOOL ABI44_0_0RCTImageLoadingPerfInstrumentationEnabled(void);
ABI44_0_0RCT_EXTERN void ABI44_0_0RCTEnableImageLoadingInstrumentation(BOOL enabled);
ABI44_0_0RCT_EXTERN void ABI44_0_0RCTEnableImageLoadingPerfInstrumentation(BOOL enabled);

ABI44_0_0RCT_EXTERN BOOL ABI44_0_0RCTGetImageLoadingPerfInstrumentationForFabricEnabled();
ABI44_0_0RCT_EXTERN void ABI44_0_0RCTSetImageLoadingPerfInstrumentationForFabricEnabledBlock(BOOL (^getEnabled)());

@protocol ABI44_0_0RCTImageLoaderWithAttributionProtocol<ABI44_0_0RCTImageLoaderProtocol, ABI44_0_0RCTImageLoaderLoggableProtocol>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the variant in ABI44_0_0RCTImageURLLoaderProtocol, but allows passing attribution
 * information that each image URL loader can process.
 */
- (ABI44_0_0RCTImageURLLoaderRequest *)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                 size:(CGSize)size
                                                scale:(CGFloat)scale
                                              clipped:(BOOL)clipped
                                           resizeMode:(ABI44_0_0RCTResizeMode)resizeMode
                                             priority: (ABI44_0_0RCTImageLoaderPriority)priority
                                          attribution:(const ABI44_0_0facebook::ABI44_0_0React::ImageURLLoaderAttribution &)attribution
                                        progressBlock:(ABI44_0_0RCTImageLoaderProgressBlock)progressBlock
                                     partialLoadBlock:(ABI44_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                      completionBlock:(ABI44_0_0RCTImageLoaderCompletionBlockWithMetadata)completionBlock;
#endif

/**
 * Image instrumentation - start tracking the on-screen visibility of the native image view.
 */
- (void)trackURLImageVisibilityForRequest:(ABI44_0_0RCTImageURLLoaderRequest *)loaderRequest imageView:(UIView *)imageView;

/**
 * Image instrumentation - notify that the request was cancelled.
 */
- (void)trackURLImageRequestDidDestroy:(ABI44_0_0RCTImageURLLoaderRequest *)loaderRequest;

/**
 * Image instrumentation - notify that the native image view was destroyed.
 */
- (void)trackURLImageDidDestroy:(ABI44_0_0RCTImageURLLoaderRequest *)loaderRequest;

@end
