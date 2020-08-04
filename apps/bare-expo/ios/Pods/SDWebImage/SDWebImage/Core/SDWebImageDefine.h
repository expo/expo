/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"

typedef void(^SDWebImageNoParamsBlock)(void);
typedef NSString * SDWebImageContextOption NS_EXTENSIBLE_STRING_ENUM;
typedef NSDictionary<SDWebImageContextOption, id> SDWebImageContext;
typedef NSMutableDictionary<SDWebImageContextOption, id> SDWebImageMutableContext;

#pragma mark - Image scale

/**
 Return the image scale factor for the specify key, supports file name and url key.
 This is the built-in way to check the scale factor when we have no context about it. Because scale factor is not stored in image data (It's typically from filename).
 However, you can also provide custom scale factor as well, see `SDWebImageContextImageScaleFactor`.

 @param key The image cache key
 @return The scale factor for image
 */
FOUNDATION_EXPORT CGFloat SDImageScaleFactorForKey(NSString * _Nullable key);

/**
 Scale the image with the scale factor for the specify key. If no need to scale, return the original image.
 This works for `UIImage`(UIKit) or `NSImage`(AppKit). And this function also preserve the associated value in `UIImage+Metadata.h`.
 @note This is actually a convenience function, which firstly call `SDImageScaleFactorForKey` and then call `SDScaledImageForScaleFactor`, kept for backward compatibility.

 @param key The image cache key
 @param image The image
 @return The scaled image
 */
FOUNDATION_EXPORT UIImage * _Nullable SDScaledImageForKey(NSString * _Nullable key, UIImage * _Nullable image);

/**
 Scale the image with the scale factor. If no need to scale, return the original image.
 This works for `UIImage`(UIKit) or `NSImage`(AppKit). And this function also preserve the associated value in `UIImage+Metadata.h`.
 
 @param scale The image scale factor
 @param image The image
 @return The scaled image
 */
FOUNDATION_EXPORT UIImage * _Nullable SDScaledImageForScaleFactor(CGFloat scale, UIImage * _Nullable image);

#pragma mark - WebCache Options

/// WebCache options
typedef NS_OPTIONS(NSUInteger, SDWebImageOptions) {
    /**
     * By default, when a URL fail to be downloaded, the URL is blacklisted so the library won't keep trying.
     * This flag disable this blacklisting.
     */
    SDWebImageRetryFailed = 1 << 0,
    
    /**
     * By default, image downloads are started during UI interactions, this flags disable this feature,
     * leading to delayed download on UIScrollView deceleration for instance.
     */
    SDWebImageLowPriority = 1 << 1,
    
    /**
     * This flag enables progressive download, the image is displayed progressively during download as a browser would do.
     * By default, the image is only displayed once completely downloaded.
     */
    SDWebImageProgressiveLoad = 1 << 2,
    
    /**
     * Even if the image is cached, respect the HTTP response cache control, and refresh the image from remote location if needed.
     * The disk caching will be handled by NSURLCache instead of SDWebImage leading to slight performance degradation.
     * This option helps deal with images changing behind the same request URL, e.g. Facebook graph api profile pics.
     * If a cached image is refreshed, the completion block is called once with the cached image and again with the final image.
     *
     * Use this flag only if you can't make your URLs static with embedded cache busting parameter.
     */
    SDWebImageRefreshCached = 1 << 3,
    
    /**
     * In iOS 4+, continue the download of the image if the app goes to background. This is achieved by asking the system for
     * extra time in background to let the request finish. If the background task expires the operation will be cancelled.
     */
    SDWebImageContinueInBackground = 1 << 4,
    
    /**
     * Handles cookies stored in NSHTTPCookieStore by setting
     * NSMutableURLRequest.HTTPShouldHandleCookies = YES;
     */
    SDWebImageHandleCookies = 1 << 5,
    
    /**
     * Enable to allow untrusted SSL certificates.
     * Useful for testing purposes. Use with caution in production.
     */
    SDWebImageAllowInvalidSSLCertificates = 1 << 6,
    
    /**
     * By default, images are loaded in the order in which they were queued. This flag moves them to
     * the front of the queue.
     */
    SDWebImageHighPriority = 1 << 7,
    
    /**
     * By default, placeholder images are loaded while the image is loading. This flag will delay the loading
     * of the placeholder image until after the image has finished loading.
     */
    SDWebImageDelayPlaceholder = 1 << 8,
    
    /**
     * We usually don't apply transform on animated images as most transformers could not manage animated images.
     * Use this flag to transform them anyway.
     */
    SDWebImageTransformAnimatedImage = 1 << 9,
    
    /**
     * By default, image is added to the imageView after download. But in some cases, we want to
     * have the hand before setting the image (apply a filter or add it with cross-fade animation for instance)
     * Use this flag if you want to manually set the image in the completion when success
     */
    SDWebImageAvoidAutoSetImage = 1 << 10,
    
    /**
     * By default, images are decoded respecting their original size.
     * This flag will scale down the images to a size compatible with the constrained memory of devices.
     * To control the limit memory bytes, check `SDImageCoderHelper.defaultScaleDownLimitBytes` (Defaults to 60MB on iOS)
     * This will actually translate to use context option `.imageThumbnailPixelSize` from v5.5.0 (Defaults to (3966, 3966) on iOS). Previously does not.
     * This flags effect the progressive and animated images as well from v5.5.0. Previously does not.
     * @note If you need detail controls, it's better to use context option `imageThumbnailPixelSize` and `imagePreserveAspectRatio` instead.
     */
    SDWebImageScaleDownLargeImages = 1 << 11,
    
    /**
     * By default, we do not query image data when the image is already cached in memory. This mask can force to query image data at the same time. However, this query is asynchronously unless you specify `SDWebImageQueryMemoryDataSync`
     */
    SDWebImageQueryMemoryData = 1 << 12,
    
    /**
     * By default, when you only specify `SDWebImageQueryMemoryData`, we query the memory image data asynchronously. Combined this mask as well to query the memory image data synchronously.
     * @note Query data synchronously is not recommend, unless you want to ensure the image is loaded in the same runloop to avoid flashing during cell reusing.
     */
    SDWebImageQueryMemoryDataSync = 1 << 13,
    
    /**
     * By default, when the memory cache miss, we query the disk cache asynchronously. This mask can force to query disk cache (when memory cache miss) synchronously.
     * @note These 3 query options can be combined together. For the full list about these masks combination, see wiki page.
     * @note Query data synchronously is not recommend, unless you want to ensure the image is loaded in the same runloop to avoid flashing during cell reusing.
     */
    SDWebImageQueryDiskDataSync = 1 << 14,
    
    /**
     * By default, when the cache missed, the image is load from the loader. This flag can prevent this to load from cache only.
     */
    SDWebImageFromCacheOnly = 1 << 15,
    
    /**
     * By default, we query the cache before the image is load from the loader. This flag can prevent this to load from loader only.
     */
    SDWebImageFromLoaderOnly = 1 << 16,
    
    /**
     * By default, when you use `SDWebImageTransition` to do some view transition after the image load finished, this transition is only applied for image download from the network. This mask can force to apply view transition for memory and disk cache as well.
     */
    SDWebImageForceTransition = 1 << 17,
    
    /**
     * By default, we will decode the image in the background during cache query and download from the network. This can help to improve performance because when rendering image on the screen, it need to be firstly decoded. But this happen on the main queue by Core Animation.
     * However, this process may increase the memory usage as well. If you are experiencing a issue due to excessive memory consumption, This flag can prevent decode the image.
     */
    SDWebImageAvoidDecodeImage = 1 << 18,
    
    /**
     * By default, we decode the animated image. This flag can force decode the first frame only and produce the static image.
     */
    SDWebImageDecodeFirstFrameOnly = 1 << 19,
    
    /**
     * By default, for `SDAnimatedImage`, we decode the animated image frame during rendering to reduce memory usage. However, you can specify to preload all frames into memory to reduce CPU usage when the animated image is shared by lots of imageViews.
     * This will actually trigger `preloadAllAnimatedImageFrames` in the background queue(Disk Cache & Download only).
     */
    SDWebImagePreloadAllFrames = 1 << 20,
    
    /**
     * By default, when you use `SDWebImageContextAnimatedImageClass` context option (like using `SDAnimatedImageView` which designed to use `SDAnimatedImage`), we may still use `UIImage` when the memory cache hit, or image decoder is not available to produce one exactlly matching your custom class as a fallback solution.
     * Using this option, can ensure we always callback image with your provided class. If failed to produce one, a error with code `SDWebImageErrorBadImageData` will been used.
     * Note this options is not compatible with `SDWebImageDecodeFirstFrameOnly`, which always produce a UIImage/NSImage.
     */
    SDWebImageMatchAnimatedImageClass = 1 << 21,
    
    /**
     * By default, when we load the image from network, the image will be written to the cache (memory and disk, controlled by your `storeCacheType` context option)
     * This maybe an asynchronously operation and the final `SDInternalCompletionBlock` callback does not guarantee the disk cache written is finished and may cause logic error. (For example, you modify the disk data just in completion block, however, the disk cache is not ready)
     * If you need to process with the disk cache in the completion block, you should use this option to ensure the disk cache already been written when callback.
     * Note if you use this when using the custom cache serializer, or using the transformer, we will also wait until the output image data written is finished.
     */
    SDWebImageWaitStoreCache = 1 << 22,
    
    /**
     * We usually don't apply transform on vector images, because vector images supports dynamically changing to any size, rasterize to a fixed size will loss details. To modify vector images, you can process the vector data at runtime (such as modifying PDF tag / SVG element).
     * Use this flag to transform them anyway.
     */
    SDWebImageTransformVectorImage = 1 << 23,
};


#pragma mark - Context Options

/**
 A String to be used as the operation key for view category to store the image load operation. This is used for view instance which supports different image loading process. If nil, will use the class name as operation key. (NSString *)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextSetImageOperationKey;

/**
 A SDWebImageManager instance to control the image download and cache process using in UIImageView+WebCache category and likes. If not provided, use the shared manager (SDWebImageManager *)
 @deprecated Deprecated in the future. This context options can be replaced by other context option control like `.imageCache`, `.imageLoader`, `.imageTransformer` (See below), which already matches all the properties in SDWebImageManager.
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextCustomManager API_DEPRECATED("Use individual context option like .imageCache, .imageLoader and .imageTransformer instead", macos(10.10, API_TO_BE_DEPRECATED), ios(8.0, API_TO_BE_DEPRECATED), tvos(9.0, API_TO_BE_DEPRECATED), watchos(2.0, API_TO_BE_DEPRECATED));

/**
 A id<SDImageCache> instance which conforms to `SDImageCache` protocol. It's used to override the image manager's cache during the image loading pipeline.
 In other word, if you just want to specify a custom cache during image loading, you don't need to re-create a dummy SDWebImageManager instance with the cache. If not provided, use the image manager's cache (id<SDImageCache>)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextImageCache;

/**
 A id<SDImageLoader> instance which conforms to `SDImageLoader` protocol. It's used to override the image manager's loader during the image loading pipeline.
 In other word, if you just want to specify a custom loader during image loading, you don't need to re-create a dummy SDWebImageManager instance with the loader. If not provided, use the image manager's cache (id<SDImageLoader>)
*/
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextImageLoader;

/**
 A id<SDImageCoder> instance which conforms to `SDImageCoder` protocol. It's used to override the default image coder for image decoding(including progressive) and encoding during the image loading process.
 If you use this context option, we will not always use `SDImageCodersManager.shared` to loop through all registered coders and find the suitable one. Instead, we will arbitrarily use the exact provided coder without extra checking (We may not call `canDecodeFromData:`).
 @note This is only useful for cases which you can ensure the loading url matches your coder, or you find it's too hard to write a common coder which can used for generic usage. This will bind the loading url with the coder logic, which is not always a good design, but possible. (id<SDImageCache>)
*/
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextImageCoder;

/**
 A id<SDImageTransformer> instance which conforms `SDImageTransformer` protocol. It's used for image transform after the image load finished and store the transformed image to cache. If you provide one, it will ignore the `transformer` in manager and use provided one instead. If you pass NSNull, the transformer feature will be disabled. (id<SDImageTransformer>)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextImageTransformer;

/**
 A CGFloat raw value which specify the image scale factor. The number should be greater than or equal to 1.0. If not provide or the number is invalid, we will use the cache key to specify the scale factor. (NSNumber)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextImageScaleFactor;

/**
 A Boolean value indicating whether to keep the original aspect ratio when generating thumbnail images (or bitmap images from vector format).
 Defaults to YES. (NSNumber)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextImagePreserveAspectRatio;

/**
 A CGSize raw value indicating whether or not to generate the thumbnail images (or bitmap images from vector format). When this value is provided, the decoder will generate a thumbnail image which pixel size is smaller than or equal to (depends the `.imagePreserveAspectRatio`) the value size.
 @note When you pass `.preserveAspectRatio == NO`, the thumbnail image is stretched to match each dimension. When `.preserveAspectRatio == YES`, the thumbnail image's width is limited to pixel size's width, the thumbnail image's height is limited to pixel size's height. For common cases, you can just pass a square size to limit both.
 Defaults to CGSizeZero, which means no thumbnail generation at all. (NSValue)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextImageThumbnailPixelSize;

/**
 A SDImageCacheType raw value which specify the source of cache to query. Specify `SDImageCacheTypeDisk` to query from disk cache only; `SDImageCacheTypeMemory` to query from memory only. And `SDImageCacheTypeAll` to query from both memory cache and disk cache. Specify `SDImageCacheTypeNone` is invalid and totally ignore the cache query.
 If not provide or the value is invalid, we will use `SDImageCacheTypeAll`. (NSNumber)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextQueryCacheType;

/**
 A SDImageCacheType raw value which specify the store cache type when the image has just been downloaded and will be stored to the cache. Specify `SDImageCacheTypeNone` to disable cache storage; `SDImageCacheTypeDisk` to store in disk cache only; `SDImageCacheTypeMemory` to store in memory only. And `SDImageCacheTypeAll` to store in both memory cache and disk cache.
 If you use image transformer feature, this actually apply for the transformed image, but not the original image itself. Use `SDWebImageContextOriginalStoreCacheType` if you want to control the original image's store cache type at the same time.
 If not provide or the value is invalid, we will use `SDImageCacheTypeAll`. (NSNumber)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextStoreCacheType;

/**
 The same behavior like `SDWebImageContextQueryCacheType`, but control the query cache type for the original image when you use image transformer feature. This allows the detail control of cache query for these two images. For example, if you want to query the transformed image from both memory/disk cache, query the original image from disk cache only, use `[.queryCacheType : .all, .originalQueryCacheType : .disk]`
 If not provide or the value is invalid, we will use `SDImageCacheTypeNone`, which does not query the original image from cache. (NSNumber)
 @note Which means, if you set this value to not be `.none`, we will query the original image from cache, then do transform with transformer, instead of actual downloading, which can save bandwidth usage.
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextOriginalQueryCacheType;

/**
 The same behavior like `SDWebImageContextStoreCacheType`, but control the store cache type for the original image when you use image transformer feature. This allows the detail control of cache storage for these two images. For example, if you want to store the transformed image into both memory/disk cache, store the original image into disk cache only, use `[.storeCacheType : .all, .originalStoreCacheType : .disk]`
 If not provide or the value is invalid, we will use `SDImageCacheTypeNone`, which does not store the original image into cache. (NSNumber)
 @note This only store the original image, if you want to use the original image without downloading in next query, specify `SDWebImageContextOriginalQueryCacheType` as well.
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextOriginalStoreCacheType;

/**
 A Class object which the instance is a `UIImage/NSImage` subclass and adopt `SDAnimatedImage` protocol. We will call `initWithData:scale:options:` to create the instance (or `initWithAnimatedCoder:scale:` when using progressive download) . If the instance create failed, fallback to normal `UIImage/NSImage`.
 This can be used to improve animated images rendering performance (especially memory usage on big animated images) with `SDAnimatedImageView` (Class).
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextAnimatedImageClass;

/**
 A id<SDWebImageDownloaderRequestModifier> instance to modify the image download request. It's used for downloader to modify the original request from URL and options. If you provide one, it will ignore the `requestModifier` in downloader and use provided one instead. (id<SDWebImageDownloaderRequestModifier>)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextDownloadRequestModifier;

/**
 A id<SDWebImageDownloaderResponseModifier> instance to modify the image download response. It's used for downloader to modify the original response from URL and options.  If you provide one, it will ignore the `responseModifier` in downloader and use provided one instead. (id<SDWebImageDownloaderResponseModifier>)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextDownloadResponseModifier;

/**
 A id<SDWebImageContextDownloadDecryptor> instance to decrypt the image download data. This can be used for image data decryption, such as Base64 encoded image. If you provide one, it will ignore the `decryptor` in downloader and use provided one instead. (id<SDWebImageContextDownloadDecryptor>)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextDownloadDecryptor;

/**
 A id<SDWebImageCacheKeyFilter> instance to convert an URL into a cache key. It's used when manager need cache key to use image cache. If you provide one, it will ignore the `cacheKeyFilter` in manager and use provided one instead. (id<SDWebImageCacheKeyFilter>)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextCacheKeyFilter;

/**
 A id<SDWebImageCacheSerializer> instance to convert the decoded image, the source downloaded data, to the actual data. It's used for manager to store image to the disk cache. If you provide one, it will ignore the `cacheSerializer` in manager and use provided one instead. (id<SDWebImageCacheSerializer>)
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextCacheSerializer;
