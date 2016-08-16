/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI6_0_0RCTBridge.h"
#import "ABI6_0_0RCTURLRequestHandler.h"
#import "ABI6_0_0RCTResizeMode.h"

@class ALAssetsLibrary;

typedef void (^ABI6_0_0RCTImageLoaderProgressBlock)(int64_t progress, int64_t total);
typedef void (^ABI6_0_0RCTImageLoaderCompletionBlock)(NSError *error, UIImage *image);
typedef void (^ABI6_0_0RCTImageLoaderCancellationBlock)(void);

@interface UIImage (ReactABI6_0_0)

@property (nonatomic, copy) CAKeyframeAnimation *ReactABI6_0_0KeyframeAnimation;

@end

@interface ABI6_0_0RCTImageLoader : NSObject <ABI6_0_0RCTBridgeModule, ABI6_0_0RCTURLRequestHandler>

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
- (ABI6_0_0RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                           callback:(ABI6_0_0RCTImageLoaderCompletionBlock)callback;

/**
 * As above, but includes target size, scale and resizeMode, which are used to
 * select the optimal dimensions for the loaded image.
 */
- (ABI6_0_0RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                      progressBlock:(ABI6_0_0RCTImageLoaderProgressBlock)progressBlock
                                    completionBlock:(ABI6_0_0RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Loads an image without clipping the result to fit - used by ABI6_0_0RCTImageView.
 */
- (ABI6_0_0RCTImageLoaderCancellationBlock)loadImageWithoutClipping:(NSString *)imageTag
                                                       size:(CGSize)size
                                                      scale:(CGFloat)scale
                                                 resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                              progressBlock:(ABI6_0_0RCTImageLoaderProgressBlock)progressBlock
                                            completionBlock:(ABI6_0_0RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Finds an appropriate image decoder and passes the target size, scale and
 * resizeMode for optimal image decoding. Can be called from any thread,
 * will call callback on an unspecified thread.
 */
- (ABI6_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                   completionBlock:(ABI6_0_0RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Decodes an image without clipping the result to fit.
 */
- (ABI6_0_0RCTImageLoaderCancellationBlock)decodeImageDataWithoutClipping:(NSData *)data
                                                             size:(CGSize)size
                                                            scale:(CGFloat)scale
                                                       resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                                  completionBlock:(ABI6_0_0RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Get image size, in pixels. This method will do the least work possible to get
 * the information, and won't decode the image if it doesn't have to.
 */
- (ABI6_0_0RCTImageLoaderCancellationBlock)getImageSize:(NSString *)imageTag
                                          block:(void(^)(NSError *error, CGSize size))completionBlock;

@end

@interface ABI6_0_0RCTBridge (ABI6_0_0RCTImageLoader)

/**
 * The shared image loader instance
 */
@property (nonatomic, readonly) ABI6_0_0RCTImageLoader *imageLoader;

@end

/**
 * Provides the interface needed to register an image loader. Image data
 * loaders are also bridge modules, so should be registered using
 * ABI6_0_0RCT_EXPORT_MODULE().
 */
@protocol ABI6_0_0RCTImageURLLoader <ABI6_0_0RCTBridgeModule>

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
- (ABI6_0_0RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                   progressHandler:(ABI6_0_0RCTImageLoaderProgressBlock)progressHandler
                                 completionHandler:(ABI6_0_0RCTImageLoaderCompletionBlock)completionHandler;

@optional

/**
 * If more than one ABI6_0_0RCTImageURLLoader responds YES to `-canLoadImageURL:`
 * then `loaderPriority` is used to determine which one to use. The loader
 * with the highest priority will be selected. Default priority is zero. If
 * two or more valid loaders have the same priority, the selection order is
 * undefined.
 */
- (float)loaderPriority;

@end

/**
 * Provides the interface needed to register an image decoder. Image decoders
 * are also bridge modules, so should be registered using ABI6_0_0RCT_EXPORT_MODULE().
 */
@protocol ABI6_0_0RCTImageDataDecoder <ABI6_0_0RCTBridgeModule>

/**
 * Indicates whether this handler is capable of decoding the specified data.
 * Typically the handler would examine some sort of header data to determine
 * this.
 */
- (BOOL)canDecodeImageData:(NSData *)imageData;

/**
 * Decode an image from the data object. The method should call the
 * completionHandler when the decoding operation  has finished. The method
 * should also return a cancellation block, if applicable.
 */
- (ABI6_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                 completionHandler:(ABI6_0_0RCTImageLoaderCompletionBlock)completionHandler;

@optional

/**
 * If more than one ABI6_0_0RCTImageDataDecoder responds YES to `-canDecodeImageData:`
 * then `decoderPriority` is used to determine which one to use. The decoder
 * with the highest priority will be selected. Default priority is zero.
 * If two or more valid decoders have the same priority, the selection order is
 * undefined.
 */
- (float)decoderPriority;

@end
