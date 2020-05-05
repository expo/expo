/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"
#import "SDWebImageOperation.h"
#import "SDImageCacheDefine.h"
#import "SDImageLoader.h"
#import "SDImageTransformer.h"
#import "SDWebImageCacheKeyFilter.h"
#import "SDWebImageCacheSerializer.h"
#import "SDWebImageOptionsProcessor.h"

typedef void(^SDExternalCompletionBlock)(UIImage * _Nullable image, NSError * _Nullable error, SDImageCacheType cacheType, NSURL * _Nullable imageURL);

typedef void(^SDInternalCompletionBlock)(UIImage * _Nullable image, NSData * _Nullable data, NSError * _Nullable error, SDImageCacheType cacheType, BOOL finished, NSURL * _Nullable imageURL);

/**
 A combined operation representing the cache and loader operation. You can use it to cancel the load process.
 */
@interface SDWebImageCombinedOperation : NSObject <SDWebImageOperation>

/**
 Cancel the current operation, including cache and loader process
 */
- (void)cancel;

/**
 The cache operation from the image cache query
 */
@property (strong, nonatomic, nullable, readonly) id<SDWebImageOperation> cacheOperation;

/**
 The loader operation from the image loader (such as download operation)
 */
@property (strong, nonatomic, nullable, readonly) id<SDWebImageOperation> loaderOperation;

@end


@class SDWebImageManager;

/**
 The manager delegate protocol.
 */
@protocol SDWebImageManagerDelegate <NSObject>

@optional

/**
 * Controls which image should be downloaded when the image is not found in the cache.
 *
 * @param imageManager The current `SDWebImageManager`
 * @param imageURL     The url of the image to be downloaded
 *
 * @return Return NO to prevent the downloading of the image on cache misses. If not implemented, YES is implied.
 */
- (BOOL)imageManager:(nonnull SDWebImageManager *)imageManager shouldDownloadImageForURL:(nonnull NSURL *)imageURL;

/**
 * Controls the complicated logic to mark as failed URLs when download error occur.
 * If the delegate implement this method, we will not use the built-in way to mark URL as failed based on error code;
 @param imageManager The current `SDWebImageManager`
 @param imageURL The url of the image
 @param error The download error for the url
 @return Whether to block this url or not. Return YES to mark this URL as failed.
 */
- (BOOL)imageManager:(nonnull SDWebImageManager *)imageManager shouldBlockFailedURL:(nonnull NSURL *)imageURL withError:(nonnull NSError *)error;

@end

/**
 * The SDWebImageManager is the class behind the UIImageView+WebCache category and likes.
 * It ties the asynchronous downloader (SDWebImageDownloader) with the image cache store (SDImageCache).
 * You can use this class directly to benefit from web image downloading with caching in another context than
 * a UIView.
 *
 * Here is a simple example of how to use SDWebImageManager:
 *
 * @code

SDWebImageManager *manager = [SDWebImageManager sharedManager];
[manager loadImageWithURL:imageURL
                  options:0
                 progress:nil
                completed:^(UIImage *image, NSData *data, NSError *error, SDImageCacheType cacheType, BOOL finished, NSURL *imageURL) {
                    if (image) {
                        // do something with image
                    }
                }];

 * @endcode
 */
@interface SDWebImageManager : NSObject

/**
 * The delegate for manager. Defatuls to nil.
 */
@property (weak, nonatomic, nullable) id <SDWebImageManagerDelegate> delegate;

/**
 * The image cache used by manager to query image cache.
 */
@property (strong, nonatomic, readonly, nonnull) id<SDImageCache> imageCache;

/**
 * The image loader used by manager to load image.
 */
@property (strong, nonatomic, readonly, nonnull) id<SDImageLoader> imageLoader;

/**
 The image transformer for manager. It's used for image transform after the image load finished and store the transformed image to cache, see `SDImageTransformer`.
 Defaults to nil, which means no transform is applied.
 @note This will affect all the load requests for this manager if you provide. However, you can pass `SDWebImageContextImageTransformer` in context arg to explicitly use that transformer instead.
 */
@property (strong, nonatomic, nullable) id<SDImageTransformer> transformer;

/**
 * The cache filter is used to convert an URL into a cache key each time SDWebImageManager need cache key to use image cache.
 *
 * The following example sets a filter in the application delegate that will remove any query-string from the
 * URL before to use it as a cache key:
 *
 * @code
 SDWebImageManager.sharedManager.cacheKeyFilter =[SDWebImageCacheKeyFilter cacheKeyFilterWithBlock:^NSString * _Nullable(NSURL * _Nonnull url) {
    url = [[NSURL alloc] initWithScheme:url.scheme host:url.host path:url.path];
    return [url absoluteString];
 }];
 * @endcode
 */
@property (nonatomic, strong, nullable) id<SDWebImageCacheKeyFilter> cacheKeyFilter;

/**
 * The cache serializer is used to convert the decoded image, the source downloaded data, to the actual data used for storing to the disk cache. If you return nil, means to generate the data from the image instance, see `SDImageCache`.
 * For example, if you are using WebP images and facing the slow decoding time issue when later retriving from disk cache again. You can try to encode the decoded image to JPEG/PNG format to disk cache instead of source downloaded data.
 * @note The `image` arg is nonnull, but when you also provide a image transformer and the image is transformed, the `data` arg may be nil, take attention to this case.
 * @note This method is called from a global queue in order to not to block the main thread.
 * @code
 SDWebImageManager.sharedManager.cacheSerializer = [SDWebImageCacheSerializer cacheSerializerWithBlock:^NSData * _Nullable(UIImage * _Nonnull image, NSData * _Nullable data, NSURL * _Nullable imageURL) {
    SDImageFormat format = [NSData sd_imageFormatForImageData:data];
    switch (format) {
        case SDImageFormatWebP:
            return image.images ? data : nil;
        default:
            return data;
    }
}];
 * @endcode
 * The default value is nil. Means we just store the source downloaded data to disk cache.
 */
@property (nonatomic, strong, nullable) id<SDWebImageCacheSerializer> cacheSerializer;

/**
 The options processor is used, to have a global control for all the image request options and context option for current manager.
 @note If you use `transformer`, `cacheKeyFilter` or `cacheSerializer` property of manager, the input context option already apply those properties before passed. This options processor is a better replacement for those property in common usage.
 For example, you can control the global options, based on the URL or original context option like the below code.
 
 @code
 SDWebImageManager.sharedManager.optionsProcessor = [SDWebImageOptionsProcessor optionsProcessorWithBlock:^SDWebImageOptionsResult * _Nullable(NSURL * _Nullable url, SDWebImageOptions options, SDWebImageContext * _Nullable context) {
     // Only do animation on `SDAnimatedImageView`
     if (!context[SDWebImageContextAnimatedImageClass]) {
        options |= SDWebImageDecodeFirstFrameOnly;
     }
     // Do not force decode for png url
     if ([url.lastPathComponent isEqualToString:@"png"]) {
        options |= SDWebImageAvoidDecodeImage;
     }
     // Always use screen scale factor
     SDWebImageMutableContext *mutableContext = [NSDictionary dictionaryWithDictionary:context];
     mutableContext[SDWebImageContextImageScaleFactor] = @(UIScreen.mainScreen.scale);
     context = [mutableContext copy];
 
     return [[SDWebImageOptionsResult alloc] initWithOptions:options context:context];
 }];
 @endcode
 */
@property (nonatomic, strong, nullable) id<SDWebImageOptionsProcessor> optionsProcessor;

/**
 * Check one or more operations running
 */
@property (nonatomic, assign, readonly, getter=isRunning) BOOL running;

/**
 The default image cache when the manager which is created with no arguments. Such as shared manager or init.
 Defaults to nil. Means using `SDImageCache.sharedImageCache`
 */
@property (nonatomic, class, nullable) id<SDImageCache> defaultImageCache;

/**
 The default image loader for manager which is created with no arguments. Such as shared manager or init.
 Defaults to nil. Means using `SDWebImageDownloader.sharedDownloader`
 */
@property (nonatomic, class, nullable) id<SDImageLoader> defaultImageLoader;

/**
 * Returns global shared manager instance.
 */
@property (nonatomic, class, readonly, nonnull) SDWebImageManager *sharedManager;

/**
 * Allows to specify instance of cache and image loader used with image manager.
 * @return new instance of `SDWebImageManager` with specified cache and loader.
 */
- (nonnull instancetype)initWithCache:(nonnull id<SDImageCache>)cache loader:(nonnull id<SDImageLoader>)loader NS_DESIGNATED_INITIALIZER;

/**
 * Downloads the image at the given URL if not present in cache or return the cached version otherwise.
 *
 * @param url            The URL to the image
 * @param options        A mask to specify options to use for this request
 * @param progressBlock  A block called while image is downloading
 *                       @note the progress block is executed on a background queue
 * @param completedBlock A block called when operation has been completed.
 *
 *   This parameter is required.
 * 
 *   This block has no return value and takes the requested UIImage as first parameter and the NSData representation as second parameter.
 *   In case of error the image parameter is nil and the third parameter may contain an NSError.
 *
 *   The forth parameter is an `SDImageCacheType` enum indicating if the image was retrieved from the local cache
 *   or from the memory cache or from the network.
 *
 *   The fith parameter is set to NO when the SDWebImageProgressiveLoad option is used and the image is
 *   downloading. This block is thus called repeatedly with a partial image. When image is fully downloaded, the
 *   block is called a last time with the full image and the last parameter set to YES.
 *
 *   The last parameter is the original image URL
 *
 * @return Returns an instance of SDWebImageCombinedOperation, which you can cancel the loading process.
 */
- (nullable SDWebImageCombinedOperation *)loadImageWithURL:(nullable NSURL *)url
                                                   options:(SDWebImageOptions)options
                                                  progress:(nullable SDImageLoaderProgressBlock)progressBlock
                                                 completed:(nonnull SDInternalCompletionBlock)completedBlock;

/**
 * Downloads the image at the given URL if not present in cache or return the cached version otherwise.
 *
 * @param url            The URL to the image
 * @param options        A mask to specify options to use for this request
 * @param context        A context contains different options to perform specify changes or processes, see `SDWebImageContextOption`. This hold the extra objects which `options` enum can not hold.
 * @param progressBlock  A block called while image is downloading
 *                       @note the progress block is executed on a background queue
 * @param completedBlock A block called when operation has been completed.
 *
 * @return Returns an instance of SDWebImageCombinedOperation, which you can cancel the loading process.
 */
- (nullable SDWebImageCombinedOperation *)loadImageWithURL:(nullable NSURL *)url
                                                   options:(SDWebImageOptions)options
                                                   context:(nullable SDWebImageContext *)context
                                                  progress:(nullable SDImageLoaderProgressBlock)progressBlock
                                                 completed:(nonnull SDInternalCompletionBlock)completedBlock;

/**
 * Cancel all current operations
 */
- (void)cancelAll;

/**
 * Return the cache key for a given URL
 */
- (nullable NSString *)cacheKeyForURL:(nullable NSURL *)url;

@end
