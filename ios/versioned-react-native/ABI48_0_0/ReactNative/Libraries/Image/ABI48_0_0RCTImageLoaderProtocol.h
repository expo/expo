/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageCache.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageDataDecoder.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageURLLoader.h>
#import <ABI48_0_0React/ABI48_0_0RCTResizeMode.h>
#import <ABI48_0_0React/ABI48_0_0RCTURLRequestHandler.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * If available, ABI48_0_0RCTImageRedirectProtocol is invoked before loading an asset.
 * Implementation should return either a new URL or nil when redirection is
 * not needed.
 */

@protocol ABI48_0_0RCTImageRedirectProtocol

- (NSURL *)redirectAssetsURL:(NSURL *)URL;

@end

/**
 * Image Downloading priority.
 * Use PriorityImmediate to download images at the highest priority.
 * Use PriorityPrefetch to prefetch images at a lower priority.
 * The priority logic is up to each @ABI48_0_0RCTImageLoaderProtocol implementation
 */
typedef NS_ENUM(NSInteger, ABI48_0_0RCTImageLoaderPriority) { ABI48_0_0RCTImageLoaderPriorityImmediate, ABI48_0_0RCTImageLoaderPriorityPrefetch };

@protocol ABI48_0_0RCTImageLoaderProtocol <ABI48_0_0RCTURLRequestHandler>

/**
 * The maximum number of concurrent image loading tasks. Loading and decoding
 * images can consume a lot of memory, so setting this to a higher value may
 * cause memory to spike. If you are seeing out-of-memory crashes, try reducing
 * this value.
 */
@property (nonatomic, assign) NSUInteger maxConcurrentLoadingTasks;

/**
 * The maximum number of concurrent image decoding tasks. Decoding large
 * images can be especially CPU and memory intensive, so if your are decoding a
 * lot of large images in your app, you may wish to adjust this value.
 */
@property (nonatomic, assign) NSUInteger maxConcurrentDecodingTasks;

/**
 * Decoding large images can use a lot of memory, and potentially cause the app
 * to crash. This value allows you to throttle the amount of memory used by the
 * decoder independently of the number of concurrent threads. This means you can
 * still decode a lot of small images in parallel, without allowing the decoder
 * to try to decompress multiple huge images at once. Note that this value is
 * only a hint, and not an indicator of the total memory used by the app.
 */
@property (nonatomic, assign) NSUInteger maxConcurrentDecodingBytes;

/**
 * Loads the specified image at the highest available resolution.
 * Can be called from any thread, will call back on an unspecified thread.
 */
- (nullable ABI48_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                           callback:(ABI48_0_0RCTImageLoaderCompletionBlock)callback;
/**
 * As above, but includes download `priority`.
 */
- (nullable ABI48_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                           priority:(ABI48_0_0RCTImageLoaderPriority)priority
                                                           callback:(ABI48_0_0RCTImageLoaderCompletionBlock)callback;

/**
 * As above, but includes target `size`, `scale` and `resizeMode`, which are used to
 * select the optimal dimensions for the loaded image. The `clipped` option
 * controls whether the image will be clipped to fit the specified size exactly,
 * or if the original aspect ratio should be retained.
 * `partialLoadBlock` is meant for custom image loaders that do not ship with the core ABI48_0_0RN library.
 * It is meant to be called repeatedly while loading the image as higher quality versions are decoded,
 * for instance with progressive JPEGs.
 */
- (nullable ABI48_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                               size:(CGSize)size
                                                              scale:(CGFloat)scale
                                                            clipped:(BOOL)clipped
                                                         resizeMode:(ABI48_0_0RCTResizeMode)resizeMode
                                                      progressBlock:(ABI48_0_0RCTImageLoaderProgressBlock)progressBlock
                                                   partialLoadBlock:(ABI48_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                                    completionBlock:(ABI48_0_0RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Finds an appropriate image decoder and passes the target `size`, `scale` and
 * `resizeMode` for optimal image decoding.  The `clipped` option controls
 * whether the image will be clipped to fit the specified size exactly, or
 * if the original aspect ratio should be retained. Can be called from any
 * thread, will call callback on an unspecified thread.
 */
- (ABI48_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                           clipped:(BOOL)clipped
                                        resizeMode:(ABI48_0_0RCTResizeMode)resizeMode
                                   completionBlock:(ABI48_0_0RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Get image size, in pixels. This method will do the least work possible to get
 * the information, and won't decode the image if it doesn't have to.
 */
- (ABI48_0_0RCTImageLoaderCancellationBlock)getImageSizeForURLRequest:(NSURLRequest *)imageURLRequest
                                                       block:(void (^)(NSError *error, CGSize size))completionBlock;
/**
 * Determines whether given image URLs are cached locally. The `requests` array is expected
 * to contain objects convertible to NSURLRequest. The return value maps URLs to strings:
 * "disk" for images known to be cached in non-volatile storage, "memory" for images known
 * to be cached in memory. Dictionary items corresponding to images that are not known to be
 * cached are simply missing.
 */
- (NSDictionary *)getImageCacheStatus:(NSArray *)requests;

/**
 * Allows developers to set their own caching implementation for
 * decoded images as long as it conforms to the ABI48_0_0RCTImageCache
 * protocol. This method should be called in bridgeDidInitializeModule.
 */
- (void)setImageCache:(id<ABI48_0_0RCTImageCache>)cache;

@end

NS_ASSUME_NONNULL_END
