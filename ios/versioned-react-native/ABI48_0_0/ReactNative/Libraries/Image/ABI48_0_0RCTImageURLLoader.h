/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTResizeMode.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI48_0_0RCTImageLoaderProgressBlock)(int64_t progress, int64_t total);
typedef void (^ABI48_0_0RCTImageLoaderPartialLoadBlock)(UIImage *image);
typedef void (^ABI48_0_0RCTImageLoaderCompletionBlock)(NSError *_Nullable error, UIImage *_Nullable image);
// Metadata is passed as a id in an additional parameter because there are forks of ABI48_0_0RN without this parameter,
// and the complexity of ABI48_0_0RCTImageLoader would make using protocols here difficult to typecheck.
typedef void (^ABI48_0_0RCTImageLoaderCompletionBlockWithMetadata)(
    NSError *_Nullable error,
    UIImage *_Nullable image,
    id _Nullable metadata);
typedef dispatch_block_t ABI48_0_0RCTImageLoaderCancellationBlock;

/**
 * Provides the interface needed to register an image loader. Image data
 * loaders are also bridge modules, so should be registered using
 * ABI48_0_0RCT_EXPORT_MODULE().
 */
@protocol ABI48_0_0RCTImageURLLoader <ABI48_0_0RCTBridgeModule>

/**
 * Indicates whether this data loader is capable of processing the specified
 * request URL. Typically the handler would examine the scheme/protocol of the
 * URL to determine this.
 */
- (BOOL)canLoadImageURL:(NSURL *)requestURL;

/**
 * Send a network request to load the request URL. The method should call the
 * progressHandler (if applicable) and the completionHandler when the request
 * has finished. The method should also return a cancellation block, if
 * applicable.
 */
- (nullable ABI48_0_0RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                                       size:(CGSize)size
                                                      scale:(CGFloat)scale
                                                 resizeMode:(ABI48_0_0RCTResizeMode)resizeMode
                                            progressHandler:(ABI48_0_0RCTImageLoaderProgressBlock)progressHandler
                                         partialLoadHandler:(ABI48_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                          completionHandler:(ABI48_0_0RCTImageLoaderCompletionBlock)completionHandler;

@optional

/**
 * If more than one ABI48_0_0RCTImageURLLoader responds YES to `-canLoadImageURL:`
 * then `loaderPriority` is used to determine which one to use. The loader
 * with the highest priority will be selected. Default priority is zero. If
 * two or more valid loaders have the same priority, the selection order is
 * undefined.
 */
- (float)loaderPriority;

/**
 * If the loader must be called on the serial url cache queue, and whether the completion
 * block should be dispatched off the main thread. If this is NO, the loader will be
 * called from the main queue. Defaults to YES.
 *
 * Use with care: disabling scheduling will reduce ABI48_0_0RCTImageLoader's ability to throttle
 * network requests.
 */
- (BOOL)requiresScheduling;

/**
 * If images loaded by the loader should be cached in the decoded image cache.
 * Defaults to YES.
 */
- (BOOL)shouldCacheLoadedImages;

@end

NS_ASSUME_NONNULL_END
