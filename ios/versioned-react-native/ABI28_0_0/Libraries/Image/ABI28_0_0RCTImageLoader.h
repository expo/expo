/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTResizeMode.h>
#import <ReactABI28_0_0/ABI28_0_0RCTURLRequestHandler.h>

typedef void (^ABI28_0_0RCTImageLoaderProgressBlock)(int64_t progress, int64_t total);
typedef void (^ABI28_0_0RCTImageLoaderPartialLoadBlock)(UIImage *image);
typedef void (^ABI28_0_0RCTImageLoaderCompletionBlock)(NSError *error, UIImage *image);
typedef dispatch_block_t ABI28_0_0RCTImageLoaderCancellationBlock;

/**
 * Provides an interface to use for providing a image caching strategy.
 */
@protocol ABI28_0_0RCTImageCache <NSObject>

- (UIImage *)imageForUrl:(NSString *)url
                    size:(CGSize)size
                   scale:(CGFloat)scale
              resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
            responseDate:(NSString *)responseDate;

- (void)addImageToCache:(UIImage *)image
                    URL:(NSString *)url
                   size:(CGSize)size
                  scale:(CGFloat)scale
             resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
           responseDate:(NSString *)responseDate;

@end

/**
 * If available, ABI28_0_0RCTImageRedirectProtocol is invoked before loading an asset.
 * Implementation should return either a new URL or nil when redirection is
 * not needed.
 */

@protocol ABI28_0_0RCTImageRedirectProtocol

- (NSURL *)redirectAssetsURL:(NSURL *)URL;

@end

@interface UIImage (ReactABI28_0_0)

@property (nonatomic, copy) CAKeyframeAnimation *ReactABI28_0_0KeyframeAnimation;

@end

@interface ABI28_0_0RCTImageLoader : NSObject <ABI28_0_0RCTBridgeModule, ABI28_0_0RCTURLRequestHandler>

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

- (instancetype)init;
- (instancetype)initWithRedirectDelegate:(id<ABI28_0_0RCTImageRedirectProtocol>)redirectDelegate NS_DESIGNATED_INITIALIZER;

/**
 * Loads the specified image at the highest available resolution.
 * Can be called from any thread, will call back on an unspecified thread.
 */
- (ABI28_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                  callback:(ABI28_0_0RCTImageLoaderCompletionBlock)callback;

/**
 * As above, but includes target `size`, `scale` and `resizeMode`, which are used to
 * select the optimal dimensions for the loaded image. The `clipped` option
 * controls whether the image will be clipped to fit the specified size exactly,
 * or if the original aspect ratio should be retained.
 * `partialLoadBlock` is meant for custom image loaders that do not ship with the core RN library.
 * It is meant to be called repeatedly while loading the image as higher quality versions are decoded,
 * for instance with progressive JPEGs.
 */
- (ABI28_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                      size:(CGSize)size
                                                     scale:(CGFloat)scale
                                                   clipped:(BOOL)clipped
                                                resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
                                             progressBlock:(ABI28_0_0RCTImageLoaderProgressBlock)progressBlock
                                          partialLoadBlock:(ABI28_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                           completionBlock:(ABI28_0_0RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Finds an appropriate image decoder and passes the target `size`, `scale` and
 * `resizeMode` for optimal image decoding.  The `clipped` option controls
 * whether the image will be clipped to fit the specified size exactly, or
 * if the original aspect ratio should be retained. Can be called from any
 * thread, will call callback on an unspecified thread.
 */
- (ABI28_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                           clipped:(BOOL)clipped
                                        resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
                                   completionBlock:(ABI28_0_0RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Get image size, in pixels. This method will do the least work possible to get
 * the information, and won't decode the image if it doesn't have to.
 */
- (ABI28_0_0RCTImageLoaderCancellationBlock)getImageSizeForURLRequest:(NSURLRequest *)imageURLRequest
                                                       block:(void(^)(NSError *error, CGSize size))completionBlock;

/**
 * Allows developers to set their own caching implementation for
 * decoded images as long as it conforms to the ABI28_0_0RCTImageCacheDelegate
 * protocol. This method should be called in bridgeDidInitializeModule.
 */
- (void)setImageCache:(id<ABI28_0_0RCTImageCache>)cache;

@end

@interface ABI28_0_0RCTBridge (ABI28_0_0RCTImageLoader)

/**
 * The shared image loader instance
 */
@property (nonatomic, readonly) ABI28_0_0RCTImageLoader *imageLoader;

@end

/**
 * Provides the interface needed to register an image loader. Image data
 * loaders are also bridge modules, so should be registered using
 * ABI28_0_0RCT_EXPORT_MODULE().
 */
@protocol ABI28_0_0RCTImageURLLoader <ABI28_0_0RCTBridgeModule>

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
- (ABI28_0_0RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
                                   progressHandler:(ABI28_0_0RCTImageLoaderProgressBlock)progressHandler
                                partialLoadHandler:(ABI28_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                 completionHandler:(ABI28_0_0RCTImageLoaderCompletionBlock)completionHandler;

@optional

/**
 * If more than one ABI28_0_0RCTImageURLLoader responds YES to `-canLoadImageURL:`
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
 * Use with care: disabling scheduling will reduce ABI28_0_0RCTImageLoader's ability to throttle
 * network requests.
 */
- (BOOL)requiresScheduling;

/**
 * If images loaded by the loader should be cached in the decoded image cache.
 * Defaults to YES.
 */
- (BOOL)shouldCacheLoadedImages;

@end

/**
 * Provides the interface needed to register an image decoder. Image decoders
 * are also bridge modules, so should be registered using ABI28_0_0RCT_EXPORT_MODULE().
 */
@protocol ABI28_0_0RCTImageDataDecoder <ABI28_0_0RCTBridgeModule>

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
 *
 * If you provide a custom image decoder, you most implement scheduling yourself,
 * to avoid decoding large amounts of images at the same time.
 */
- (ABI28_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
                                 completionHandler:(ABI28_0_0RCTImageLoaderCompletionBlock)completionHandler;

@optional

/**
 * If more than one ABI28_0_0RCTImageDataDecoder responds YES to `-canDecodeImageData:`
 * then `decoderPriority` is used to determine which one to use. The decoder
 * with the highest priority will be selected. Default priority is zero.
 * If two or more valid decoders have the same priority, the selection order is
 * undefined.
 */
- (float)decoderPriority;

@end
