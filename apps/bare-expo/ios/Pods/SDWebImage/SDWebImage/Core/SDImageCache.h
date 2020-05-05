/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import <Foundation/Foundation.h>
#import "SDWebImageCompat.h"
#import "SDWebImageDefine.h"
#import "SDImageCacheConfig.h"
#import "SDImageCacheDefine.h"
#import "SDMemoryCache.h"
#import "SDDiskCache.h"

/// Image Cache Options
typedef NS_OPTIONS(NSUInteger, SDImageCacheOptions) {
    /**
     * By default, we do not query image data when the image is already cached in memory. This mask can force to query image data at the same time. However, this query is asynchronously unless you specify `SDImageCacheQueryMemoryDataSync`
     */
    SDImageCacheQueryMemoryData = 1 << 0,
    /**
     * By default, when you only specify `SDImageCacheQueryMemoryData`, we query the memory image data asynchronously. Combined this mask as well to query the memory image data synchronously.
     */
    SDImageCacheQueryMemoryDataSync = 1 << 1,
    /**
     * By default, when the memory cache miss, we query the disk cache asynchronously. This mask can force to query disk cache (when memory cache miss) synchronously.
     @note These 3 query options can be combined together. For the full list about these masks combination, see wiki page.
     */
    SDImageCacheQueryDiskDataSync = 1 << 2,
    /**
     * By default, images are decoded respecting their original size. On iOS, this flag will scale down the
     * images to a size compatible with the constrained memory of devices.
     */
    SDImageCacheScaleDownLargeImages = 1 << 3,
    /**
     * By default, we will decode the image in the background during cache query and download from the network. This can help to improve performance because when rendering image on the screen, it need to be firstly decoded. But this happen on the main queue by Core Animation.
     * However, this process may increase the memory usage as well. If you are experiencing a issue due to excessive memory consumption, This flag can prevent decode the image.
     */
    SDImageCacheAvoidDecodeImage = 1 << 4,
    /**
     * By default, we decode the animated image. This flag can force decode the first frame only and produece the static image.
     */
    SDImageCacheDecodeFirstFrameOnly = 1 << 5,
    /**
     * By default, for `SDAnimatedImage`, we decode the animated image frame during rendering to reduce memory usage. This flag actually trigger `preloadAllAnimatedImageFrames = YES` after image load from disk cache
     */
    SDImageCachePreloadAllFrames = 1 << 6,
    /**
     * By default, when you use `SDWebImageContextAnimatedImageClass` context option (like using `SDAnimatedImageView` which designed to use `SDAnimatedImage`), we may still use `UIImage` when the memory cache hit, or image decoder is not available, to behave as a fallback solution.
     * Using this option, can ensure we always produce image with your provided class. If failed, a error with code `SDWebImageErrorBadImageData` will been used.
     * Note this options is not compatible with `SDImageCacheDecodeFirstFrameOnly`, which always produce a UIImage/NSImage.
     */
    SDImageCacheMatchAnimatedImageClass = 1 << 7,
};

/**
 * SDImageCache maintains a memory cache and a disk cache. Disk cache write operations are performed
 * asynchronous so it doesn’t add unnecessary latency to the UI.
 */
@interface SDImageCache : NSObject

#pragma mark - Properties

/**
 *  Cache Config object - storing all kind of settings.
 *  The property is copy so change of currrent config will not accidentally affect other cache's config.
 */
@property (nonatomic, copy, nonnull, readonly) SDImageCacheConfig *config;

/**
 * The memory cache implementation object used for current image cache.
 * By default we use `SDMemoryCache` class, you can also use this to call your own implementation class method.
 * @note To customize this class, check `SDImageCacheConfig.memoryCacheClass` property.
 */
@property (nonatomic, strong, readonly, nonnull) id<SDMemoryCache> memoryCache;

/**
 * The disk cache implementation object used for current image cache.
 * By default we use `SDMemoryCache` class, you can also use this to call your own implementation class method.
 * @note To customize this class, check `SDImageCacheConfig.diskCacheClass` property.
 * @warning When calling method about read/write in disk cache, be sure to either make your disk cache implementation IO-safe or using the same access queue to avoid issues.
 */
@property (nonatomic, strong, readonly, nonnull) id<SDDiskCache> diskCache;

/**
 *  The disk cache's root path
 */
@property (nonatomic, copy, nonnull, readonly) NSString *diskCachePath;

/**
 *  The additional disk cache path to check if the query from disk cache not exist;
 *  The `key` param is the image cache key. The returned file path will be used to load the disk cache. If return nil, ignore it.
 *  Useful if you want to bundle pre-loaded images with your app
 */
@property (nonatomic, copy, nullable) SDImageCacheAdditionalCachePathBlock additionalCachePathBlock;

#pragma mark - Singleton and initialization

/**
 * Returns global shared cache instance
 */
@property (nonatomic, class, readonly, nonnull) SDImageCache *sharedImageCache;

/**
 * Init a new cache store with a specific namespace
 *
 * @param ns The namespace to use for this cache store
 */
- (nonnull instancetype)initWithNamespace:(nonnull NSString *)ns;

/**
 * Init a new cache store with a specific namespace and directory.
 * If you don't provide the disk cache directory, we will use the User Cache directory with prefix (~/Library/Caches/com.hackemist.SDImageCache/).
 *
 * @param ns        The namespace to use for this cache store
 * @param directory Directory to cache disk images in
 */
- (nonnull instancetype)initWithNamespace:(nonnull NSString *)ns
                       diskCacheDirectory:(nullable NSString *)directory;

/**
 * Init a new cache store with a specific namespace, directory and file manager
 * The final disk cache directory should looks like ($directory/$namespace). And the default config of shared cache, should result in (~/Library/Caches/com.hackemist.SDImageCache/default/)
 *
 * @param ns          The namespace to use for this cache store
 * @param directory   Directory to cache disk images in
 * @param config      The cache config to be used to create the cache. You can provide custom memory cache or disk cache class in the cache config
 */
- (nonnull instancetype)initWithNamespace:(nonnull NSString *)ns
                       diskCacheDirectory:(nullable NSString *)directory
                                   config:(nullable SDImageCacheConfig *)config NS_DESIGNATED_INITIALIZER;

#pragma mark - Cache paths

/**
 Get the cache path for a certain key
 
 @param key The unique image cache key
 @return The cache path. You can check `lastPathComponent` to grab the file name.
 */
- (nullable NSString *)cachePathForKey:(nullable NSString *)key;

#pragma mark - Store Ops

/**
 * Asynchronously store an image into memory and disk cache at the given key.
 *
 * @param image           The image to store
 * @param key             The unique image cache key, usually it's image absolute URL
 * @param completionBlock A block executed after the operation is finished
 */
- (void)storeImage:(nullable UIImage *)image
            forKey:(nullable NSString *)key
        completion:(nullable SDWebImageNoParamsBlock)completionBlock;

/**
 * Asynchronously store an image into memory and disk cache at the given key.
 *
 * @param image           The image to store
 * @param key             The unique image cache key, usually it's image absolute URL
 * @param toDisk          Store the image to disk cache if YES. If NO, the completion block is called synchronously
 * @param completionBlock A block executed after the operation is finished
 * @note If no image data is provided and encode to disk, we will try to detect the image format (using either `sd_imageFormat` or `SDAnimatedImage` protocol method) and animation status, to choose the best matched format, including GIF, JPEG or PNG.
 */
- (void)storeImage:(nullable UIImage *)image
            forKey:(nullable NSString *)key
            toDisk:(BOOL)toDisk
        completion:(nullable SDWebImageNoParamsBlock)completionBlock;

/**
 * Asynchronously store an image into memory and disk cache at the given key.
 *
 * @param image           The image to store
 * @param imageData       The image data as returned by the server, this representation will be used for disk storage
 *                        instead of converting the given image object into a storable/compressed image format in order
 *                        to save quality and CPU
 * @param key             The unique image cache key, usually it's image absolute URL
 * @param toDisk          Store the image to disk cache if YES. If NO, the completion block is called synchronously
 * @param completionBlock A block executed after the operation is finished
 * @note If no image data is provided and encode to disk, we will try to detect the image format (using either `sd_imageFormat` or `SDAnimatedImage` protocol method) and animation status, to choose the best matched format, including GIF, JPEG or PNG.
 */
- (void)storeImage:(nullable UIImage *)image
         imageData:(nullable NSData *)imageData
            forKey:(nullable NSString *)key
            toDisk:(BOOL)toDisk
        completion:(nullable SDWebImageNoParamsBlock)completionBlock;

/**
 * Synchronously store image into memory cache at the given key.
 *
 * @param image  The image to store
 * @param key    The unique image cache key, usually it's image absolute URL
 */
- (void)storeImageToMemory:(nullable UIImage*)image
                    forKey:(nullable NSString *)key;

/**
 * Synchronously store image data into disk cache at the given key.
 *
 * @param imageData  The image data to store
 * @param key        The unique image cache key, usually it's image absolute URL
 */
- (void)storeImageDataToDisk:(nullable NSData *)imageData
                      forKey:(nullable NSString *)key;


#pragma mark - Contains and Check Ops

/**
 *  Asynchronously check if image exists in disk cache already (does not load the image)
 *
 *  @param key             the key describing the url
 *  @param completionBlock the block to be executed when the check is done.
 *  @note the completion block will be always executed on the main queue
 */
- (void)diskImageExistsWithKey:(nullable NSString *)key completion:(nullable SDImageCacheCheckCompletionBlock)completionBlock;

/**
 *  Synchronously check if image data exists in disk cache already (does not load the image)
 *
 *  @param key             the key describing the url
 */
- (BOOL)diskImageDataExistsWithKey:(nullable NSString *)key;

#pragma mark - Query and Retrieve Ops

/**
 * Asynchronously queries the cache with operation and call the completion when done.
 *  Query the image data for the given key synchronously.
 *
 *  @param key The unique key used to store the wanted image
 *  @return The image data for the given key, or nil if not found.
 */
- (nullable NSData *)diskImageDataForKey:(nullable NSString *)key;

/**
 * Operation that queries the cache asynchronously and call the completion when done.
 *
 * @param key       The unique key used to store the wanted image
 * @param doneBlock The completion block. Will not get called if the operation is cancelled
 *
 * @return a NSOperation instance containing the cache op
 */
- (nullable NSOperation *)queryCacheOperationForKey:(nullable NSString *)key done:(nullable SDImageCacheQueryCompletionBlock)doneBlock;

/**
 * Asynchronously queries the cache with operation and call the completion when done.
 *
 * @param key       The unique key used to store the wanted image
 * @param options   A mask to specify options to use for this cache query
 * @param doneBlock The completion block. Will not get called if the operation is cancelled
 *
 * @return a NSOperation instance containing the cache op
 */
- (nullable NSOperation *)queryCacheOperationForKey:(nullable NSString *)key options:(SDImageCacheOptions)options done:(nullable SDImageCacheQueryCompletionBlock)doneBlock;

/**
 * Asynchronously queries the cache with operation and call the completion when done.
 *
 * @param key       The unique key used to store the wanted image
 * @param options   A mask to specify options to use for this cache query
 * @param context   A context contains different options to perform specify changes or processes, see `SDWebImageContextOption`. This hold the extra objects which `options` enum can not hold.
 * @param doneBlock The completion block. Will not get called if the operation is cancelled
 *
 * @return a NSOperation instance containing the cache op
 */
- (nullable NSOperation *)queryCacheOperationForKey:(nullable NSString *)key options:(SDImageCacheOptions)options context:(nullable SDWebImageContext *)context done:(nullable SDImageCacheQueryCompletionBlock)doneBlock;

/**
 * Synchronously query the memory cache.
 *
 * @param key The unique key used to store the image
 * @return The image for the given key, or nil if not found.
 */
- (nullable UIImage *)imageFromMemoryCacheForKey:(nullable NSString *)key;

/**
 * Synchronously query the disk cache.
 *
 * @param key The unique key used to store the image
 * @return The image for the given key, or nil if not found.
 */
- (nullable UIImage *)imageFromDiskCacheForKey:(nullable NSString *)key;

/**
 * Synchronously query the cache (memory and or disk) after checking the memory cache.
 *
 * @param key The unique key used to store the image
 * @return The image for the given key, or nil if not found.
 */
- (nullable UIImage *)imageFromCacheForKey:(nullable NSString *)key;

#pragma mark - Remove Ops

/**
 * Asynchronously remove the image from memory and disk cache
 *
 * @param key             The unique image cache key
 * @param completion      A block that should be executed after the image has been removed (optional)
 */
- (void)removeImageForKey:(nullable NSString *)key withCompletion:(nullable SDWebImageNoParamsBlock)completion;

/**
 * Asynchronously remove the image from memory and optionally disk cache
 *
 * @param key             The unique image cache key
 * @param fromDisk        Also remove cache entry from disk if YES. If NO, the completion block is called synchronously
 * @param completion      A block that should be executed after the image has been removed (optional)
 */
- (void)removeImageForKey:(nullable NSString *)key fromDisk:(BOOL)fromDisk withCompletion:(nullable SDWebImageNoParamsBlock)completion;

/**
 Synchronously remove the image from memory cache.
 
 @param key The unique image cache key
 */
- (void)removeImageFromMemoryForKey:(nullable NSString *)key;

/**
 Synchronously remove the image from disk cache.
 
 @param key The unique image cache key
 */
- (void)removeImageFromDiskForKey:(nullable NSString *)key;

#pragma mark - Cache clean Ops

/**
 * Synchronously Clear all memory cached images
 */
- (void)clearMemory;

/**
 * Asynchronously clear all disk cached images. Non-blocking method - returns immediately.
 * @param completion    A block that should be executed after cache expiration completes (optional)
 */
- (void)clearDiskOnCompletion:(nullable SDWebImageNoParamsBlock)completion;

/**
 * Asynchronously remove all expired cached image from disk. Non-blocking method - returns immediately.
 * @param completionBlock A block that should be executed after cache expiration completes (optional)
 */
- (void)deleteOldFilesWithCompletionBlock:(nullable SDWebImageNoParamsBlock)completionBlock;

#pragma mark - Cache Info

/**
 * Get the total bytes size of images in the disk cache
 */
- (NSUInteger)totalDiskSize;

/**
 * Get the number of images in the disk cache
 */
- (NSUInteger)totalDiskCount;

/**
 * Asynchronously calculate the disk cache's size.
 */
- (void)calculateSizeWithCompletionBlock:(nullable SDImageCacheCalculateSizeBlock)completionBlock;

@end

/**
 * SDImageCache is the built-in image cache implementation for web image manager. It adopts `SDImageCache` protocol to provide the function for web image manager to use for image loading process.
 */
@interface SDImageCache (SDImageCache) <SDImageCache>

@end
