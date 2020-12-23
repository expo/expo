/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageManager.h"
#import "SDImageCache.h"
#import "SDWebImageDownloader.h"
#import "UIImage+Metadata.h"
#import "SDAssociatedObject.h"
#import "SDWebImageError.h"
#import "SDInternalMacros.h"

static id<SDImageCache> _defaultImageCache;
static id<SDImageLoader> _defaultImageLoader;

@interface SDWebImageCombinedOperation ()

@property (assign, nonatomic, getter = isCancelled) BOOL cancelled;
@property (strong, nonatomic, readwrite, nullable) id<SDWebImageOperation> loaderOperation;
@property (strong, nonatomic, readwrite, nullable) id<SDWebImageOperation> cacheOperation;
@property (weak, nonatomic, nullable) SDWebImageManager *manager;

@end

@interface SDWebImageManager () {
    SD_LOCK_DECLARE(_failedURLsLock); // a lock to keep the access to `failedURLs` thread-safe
    SD_LOCK_DECLARE(_runningOperationsLock); // a lock to keep the access to `runningOperations` thread-safe
}

@property (strong, nonatomic, readwrite, nonnull) SDImageCache *imageCache;
@property (strong, nonatomic, readwrite, nonnull) id<SDImageLoader> imageLoader;
@property (strong, nonatomic, nonnull) NSMutableSet<NSURL *> *failedURLs;
@property (strong, nonatomic, nonnull) NSMutableSet<SDWebImageCombinedOperation *> *runningOperations;

@end

@implementation SDWebImageManager

+ (id<SDImageCache>)defaultImageCache {
    return _defaultImageCache;
}

+ (void)setDefaultImageCache:(id<SDImageCache>)defaultImageCache {
    if (defaultImageCache && ![defaultImageCache conformsToProtocol:@protocol(SDImageCache)]) {
        return;
    }
    _defaultImageCache = defaultImageCache;
}

+ (id<SDImageLoader>)defaultImageLoader {
    return _defaultImageLoader;
}

+ (void)setDefaultImageLoader:(id<SDImageLoader>)defaultImageLoader {
    if (defaultImageLoader && ![defaultImageLoader conformsToProtocol:@protocol(SDImageLoader)]) {
        return;
    }
    _defaultImageLoader = defaultImageLoader;
}

+ (nonnull instancetype)sharedManager {
    static dispatch_once_t once;
    static id instance;
    dispatch_once(&once, ^{
        instance = [self new];
    });
    return instance;
}

- (nonnull instancetype)init {
    id<SDImageCache> cache = [[self class] defaultImageCache];
    if (!cache) {
        cache = [SDImageCache sharedImageCache];
    }
    id<SDImageLoader> loader = [[self class] defaultImageLoader];
    if (!loader) {
        loader = [SDWebImageDownloader sharedDownloader];
    }
    return [self initWithCache:cache loader:loader];
}

- (nonnull instancetype)initWithCache:(nonnull id<SDImageCache>)cache loader:(nonnull id<SDImageLoader>)loader {
    if ((self = [super init])) {
        _imageCache = cache;
        _imageLoader = loader;
        _failedURLs = [NSMutableSet new];
        SD_LOCK_INIT(_failedURLsLock);
        _runningOperations = [NSMutableSet new];
        SD_LOCK_INIT(_runningOperationsLock);
    }
    return self;
}

- (nullable NSString *)cacheKeyForURL:(nullable NSURL *)url {
    if (!url) {
        return @"";
    }
    
    NSString *key;
    // Cache Key Filter
    id<SDWebImageCacheKeyFilter> cacheKeyFilter = self.cacheKeyFilter;
    if (cacheKeyFilter) {
        key = [cacheKeyFilter cacheKeyForURL:url];
    } else {
        key = url.absoluteString;
    }
    
    return key;
}

- (nullable NSString *)cacheKeyForURL:(nullable NSURL *)url context:(nullable SDWebImageContext *)context {
    if (!url) {
        return @"";
    }
    
    NSString *key;
    // Cache Key Filter
    id<SDWebImageCacheKeyFilter> cacheKeyFilter = self.cacheKeyFilter;
    if (context[SDWebImageContextCacheKeyFilter]) {
        cacheKeyFilter = context[SDWebImageContextCacheKeyFilter];
    }
    if (cacheKeyFilter) {
        key = [cacheKeyFilter cacheKeyForURL:url];
    } else {
        key = url.absoluteString;
    }
    
    // Thumbnail Key Appending
    NSValue *thumbnailSizeValue = context[SDWebImageContextImageThumbnailPixelSize];
    if (thumbnailSizeValue != nil) {
        CGSize thumbnailSize = CGSizeZero;
#if SD_MAC
        thumbnailSize = thumbnailSizeValue.sizeValue;
#else
        thumbnailSize = thumbnailSizeValue.CGSizeValue;
#endif
        BOOL preserveAspectRatio = YES;
        NSNumber *preserveAspectRatioValue = context[SDWebImageContextImagePreserveAspectRatio];
        if (preserveAspectRatioValue != nil) {
            preserveAspectRatio = preserveAspectRatioValue.boolValue;
        }
        key = SDThumbnailedKeyForKey(key, thumbnailSize, preserveAspectRatio);
    }
    
    // Transformer Key Appending
    id<SDImageTransformer> transformer = self.transformer;
    if (context[SDWebImageContextImageTransformer]) {
        transformer = context[SDWebImageContextImageTransformer];
        if (![transformer conformsToProtocol:@protocol(SDImageTransformer)]) {
            transformer = nil;
        }
    }
    if (transformer) {
        key = SDTransformedKeyForKey(key, transformer.transformerKey);
    }
    
    return key;
}

- (SDWebImageCombinedOperation *)loadImageWithURL:(NSURL *)url options:(SDWebImageOptions)options progress:(SDImageLoaderProgressBlock)progressBlock completed:(SDInternalCompletionBlock)completedBlock {
    return [self loadImageWithURL:url options:options context:nil progress:progressBlock completed:completedBlock];
}

- (SDWebImageCombinedOperation *)loadImageWithURL:(nullable NSURL *)url
                                          options:(SDWebImageOptions)options
                                          context:(nullable SDWebImageContext *)context
                                         progress:(nullable SDImageLoaderProgressBlock)progressBlock
                                        completed:(nonnull SDInternalCompletionBlock)completedBlock {
    // Invoking this method without a completedBlock is pointless
    NSAssert(completedBlock != nil, @"If you mean to prefetch the image, use -[SDWebImagePrefetcher prefetchURLs] instead");

    // Very common mistake is to send the URL using NSString object instead of NSURL. For some strange reason, Xcode won't
    // throw any warning for this type mismatch. Here we failsafe this error by allowing URLs to be passed as NSString.
    if ([url isKindOfClass:NSString.class]) {
        url = [NSURL URLWithString:(NSString *)url];
    }

    // Prevents app crashing on argument type error like sending NSNull instead of NSURL
    if (![url isKindOfClass:NSURL.class]) {
        url = nil;
    }

    SDWebImageCombinedOperation *operation = [SDWebImageCombinedOperation new];
    operation.manager = self;

    BOOL isFailedUrl = NO;
    if (url) {
        SD_LOCK(_failedURLsLock);
        isFailedUrl = [self.failedURLs containsObject:url];
        SD_UNLOCK(_failedURLsLock);
    }

    if (url.absoluteString.length == 0 || (!(options & SDWebImageRetryFailed) && isFailedUrl)) {
        NSString *description = isFailedUrl ? @"Image url is blacklisted" : @"Image url is nil";
        NSInteger code = isFailedUrl ? SDWebImageErrorBlackListed : SDWebImageErrorInvalidURL;
        [self callCompletionBlockForOperation:operation completion:completedBlock error:[NSError errorWithDomain:SDWebImageErrorDomain code:code userInfo:@{NSLocalizedDescriptionKey : description}] url:url];
        return operation;
    }

    SD_LOCK(_runningOperationsLock);
    [self.runningOperations addObject:operation];
    SD_UNLOCK(_runningOperationsLock);
    
    // Preprocess the options and context arg to decide the final the result for manager
    SDWebImageOptionsResult *result = [self processedResultForURL:url options:options context:context];
    
    // Start the entry to load image from cache
    [self callCacheProcessForOperation:operation url:url options:result.options context:result.context progress:progressBlock completed:completedBlock];

    return operation;
}

- (void)cancelAll {
    SD_LOCK(_runningOperationsLock);
    NSSet<SDWebImageCombinedOperation *> *copiedOperations = [self.runningOperations copy];
    SD_UNLOCK(_runningOperationsLock);
    [copiedOperations makeObjectsPerformSelector:@selector(cancel)]; // This will call `safelyRemoveOperationFromRunning:` and remove from the array
}

- (BOOL)isRunning {
    BOOL isRunning = NO;
    SD_LOCK(_runningOperationsLock);
    isRunning = (self.runningOperations.count > 0);
    SD_UNLOCK(_runningOperationsLock);
    return isRunning;
}

- (void)removeFailedURL:(NSURL *)url {
    if (!url) {
        return;
    }
    SD_LOCK(_failedURLsLock);
    [self.failedURLs removeObject:url];
    SD_UNLOCK(_failedURLsLock);
}

- (void)removeAllFailedURLs {
    SD_LOCK(_failedURLsLock);
    [self.failedURLs removeAllObjects];
    SD_UNLOCK(_failedURLsLock);
}

#pragma mark - Private

// Query normal cache process
- (void)callCacheProcessForOperation:(nonnull SDWebImageCombinedOperation *)operation
                                 url:(nonnull NSURL *)url
                             options:(SDWebImageOptions)options
                             context:(nullable SDWebImageContext *)context
                            progress:(nullable SDImageLoaderProgressBlock)progressBlock
                           completed:(nullable SDInternalCompletionBlock)completedBlock {
    // Grab the image cache to use
    id<SDImageCache> imageCache;
    if ([context[SDWebImageContextImageCache] conformsToProtocol:@protocol(SDImageCache)]) {
        imageCache = context[SDWebImageContextImageCache];
    } else {
        imageCache = self.imageCache;
    }
    
    // Get the query cache type
    SDImageCacheType queryCacheType = SDImageCacheTypeAll;
    if (context[SDWebImageContextQueryCacheType]) {
        queryCacheType = [context[SDWebImageContextQueryCacheType] integerValue];
    }
    
    // Check whether we should query cache
    BOOL shouldQueryCache = !SD_OPTIONS_CONTAINS(options, SDWebImageFromLoaderOnly);
    if (shouldQueryCache) {
        NSString *key = [self cacheKeyForURL:url context:context];
        @weakify(operation);
        operation.cacheOperation = [imageCache queryImageForKey:key options:options context:context cacheType:queryCacheType completion:^(UIImage * _Nullable cachedImage, NSData * _Nullable cachedData, SDImageCacheType cacheType) {
            @strongify(operation);
            if (!operation || operation.isCancelled) {
                // Image combined operation cancelled by user
                [self callCompletionBlockForOperation:operation completion:completedBlock error:[NSError errorWithDomain:SDWebImageErrorDomain code:SDWebImageErrorCancelled userInfo:@{NSLocalizedDescriptionKey : @"Operation cancelled by user during querying the cache"}] url:url];
                [self safelyRemoveOperationFromRunning:operation];
                return;
            } else if (context[SDWebImageContextImageTransformer] && !cachedImage) {
                // Have a chance to query original cache instead of downloading
                [self callOriginalCacheProcessForOperation:operation url:url options:options context:context progress:progressBlock completed:completedBlock];
                return;
            }
            
            // Continue download process
            [self callDownloadProcessForOperation:operation url:url options:options context:context cachedImage:cachedImage cachedData:cachedData cacheType:cacheType progress:progressBlock completed:completedBlock];
        }];
    } else {
        // Continue download process
        [self callDownloadProcessForOperation:operation url:url options:options context:context cachedImage:nil cachedData:nil cacheType:SDImageCacheTypeNone progress:progressBlock completed:completedBlock];
    }
}

// Query original cache process
- (void)callOriginalCacheProcessForOperation:(nonnull SDWebImageCombinedOperation *)operation
                                         url:(nonnull NSURL *)url
                                     options:(SDWebImageOptions)options
                                     context:(nullable SDWebImageContext *)context
                                    progress:(nullable SDImageLoaderProgressBlock)progressBlock
                                   completed:(nullable SDInternalCompletionBlock)completedBlock {
    // Grab the image cache to use
    id<SDImageCache> imageCache;
    if ([context[SDWebImageContextImageCache] conformsToProtocol:@protocol(SDImageCache)]) {
        imageCache = context[SDWebImageContextImageCache];
    } else {
        imageCache = self.imageCache;
    }
    
    // Get the original query cache type
    SDImageCacheType originalQueryCacheType = SDImageCacheTypeNone;
    if (context[SDWebImageContextOriginalQueryCacheType]) {
        originalQueryCacheType = [context[SDWebImageContextOriginalQueryCacheType] integerValue];
    }
    
    // Check whether we should query original cache
    BOOL shouldQueryOriginalCache = (originalQueryCacheType != SDImageCacheTypeNone);
    if (shouldQueryOriginalCache) {
        // Change originContext to mutable
        SDWebImageMutableContext * __block originContext;
        if (context) {
            originContext = [context mutableCopy];
        } else {
            originContext = [NSMutableDictionary dictionary];
        }
        
        // Disable transformer for cache key generation
        id<SDImageTransformer> transformer = originContext[SDWebImageContextImageTransformer];
        originContext[SDWebImageContextImageTransformer] = [NSNull null];
        
        NSString *key = [self cacheKeyForURL:url context:originContext];
        @weakify(operation);
        operation.cacheOperation = [imageCache queryImageForKey:key options:options context:context cacheType:originalQueryCacheType completion:^(UIImage * _Nullable cachedImage, NSData * _Nullable cachedData, SDImageCacheType cacheType) {
            @strongify(operation);
            if (!operation || operation.isCancelled) {
                // Image combined operation cancelled by user
                [self callCompletionBlockForOperation:operation completion:completedBlock error:[NSError errorWithDomain:SDWebImageErrorDomain code:SDWebImageErrorCancelled userInfo:@{NSLocalizedDescriptionKey : @"Operation cancelled by user during querying the cache"}] url:url];
                [self safelyRemoveOperationFromRunning:operation];
                return;
            }
            
            // Add original transformer
            if (transformer) {
                originContext[SDWebImageContextImageTransformer] = transformer;
            }
            
            // Use the store cache process instead of downloading, and ignore .refreshCached option for now
            [self callStoreCacheProcessForOperation:operation url:url options:options context:context downloadedImage:cachedImage downloadedData:cachedData finished:YES progress:progressBlock completed:completedBlock];
            
            [self safelyRemoveOperationFromRunning:operation];
        }];
    } else {
        // Continue download process
        [self callDownloadProcessForOperation:operation url:url options:options context:context cachedImage:nil cachedData:nil cacheType:originalQueryCacheType progress:progressBlock completed:completedBlock];
    }
}

// Download process
- (void)callDownloadProcessForOperation:(nonnull SDWebImageCombinedOperation *)operation
                                    url:(nonnull NSURL *)url
                                options:(SDWebImageOptions)options
                                context:(SDWebImageContext *)context
                            cachedImage:(nullable UIImage *)cachedImage
                             cachedData:(nullable NSData *)cachedData
                              cacheType:(SDImageCacheType)cacheType
                               progress:(nullable SDImageLoaderProgressBlock)progressBlock
                              completed:(nullable SDInternalCompletionBlock)completedBlock {
    // Grab the image loader to use
    id<SDImageLoader> imageLoader;
    if ([context[SDWebImageContextImageLoader] conformsToProtocol:@protocol(SDImageLoader)]) {
        imageLoader = context[SDWebImageContextImageLoader];
    } else {
        imageLoader = self.imageLoader;
    }
    
    // Check whether we should download image from network
    BOOL shouldDownload = !SD_OPTIONS_CONTAINS(options, SDWebImageFromCacheOnly);
    shouldDownload &= (!cachedImage || options & SDWebImageRefreshCached);
    shouldDownload &= (![self.delegate respondsToSelector:@selector(imageManager:shouldDownloadImageForURL:)] || [self.delegate imageManager:self shouldDownloadImageForURL:url]);
    if ([imageLoader respondsToSelector:@selector(canRequestImageForURL:options:context:)]) {
        shouldDownload &= [imageLoader canRequestImageForURL:url options:options context:context];
    } else {
        shouldDownload &= [imageLoader canRequestImageForURL:url];
    }
    if (shouldDownload) {
        if (cachedImage && options & SDWebImageRefreshCached) {
            // If image was found in the cache but SDWebImageRefreshCached is provided, notify about the cached image
            // AND try to re-download it in order to let a chance to NSURLCache to refresh it from server.
            [self callCompletionBlockForOperation:operation completion:completedBlock image:cachedImage data:cachedData error:nil cacheType:cacheType finished:YES url:url];
            // Pass the cached image to the image loader. The image loader should check whether the remote image is equal to the cached image.
            SDWebImageMutableContext *mutableContext;
            if (context) {
                mutableContext = [context mutableCopy];
            } else {
                mutableContext = [NSMutableDictionary dictionary];
            }
            mutableContext[SDWebImageContextLoaderCachedImage] = cachedImage;
            context = [mutableContext copy];
        }
        
        @weakify(operation);
        operation.loaderOperation = [imageLoader requestImageWithURL:url options:options context:context progress:progressBlock completed:^(UIImage *downloadedImage, NSData *downloadedData, NSError *error, BOOL finished) {
            @strongify(operation);
            if (!operation || operation.isCancelled) {
                // Image combined operation cancelled by user
                [self callCompletionBlockForOperation:operation completion:completedBlock error:[NSError errorWithDomain:SDWebImageErrorDomain code:SDWebImageErrorCancelled userInfo:@{NSLocalizedDescriptionKey : @"Operation cancelled by user during sending the request"}] url:url];
            } else if (cachedImage && options & SDWebImageRefreshCached && [error.domain isEqualToString:SDWebImageErrorDomain] && error.code == SDWebImageErrorCacheNotModified) {
                // Image refresh hit the NSURLCache cache, do not call the completion block
            } else if ([error.domain isEqualToString:SDWebImageErrorDomain] && error.code == SDWebImageErrorCancelled) {
                // Download operation cancelled by user before sending the request, don't block failed URL
                [self callCompletionBlockForOperation:operation completion:completedBlock error:error url:url];
            } else if (error) {
                [self callCompletionBlockForOperation:operation completion:completedBlock error:error url:url];
                BOOL shouldBlockFailedURL = [self shouldBlockFailedURLWithURL:url error:error options:options context:context];
                
                if (shouldBlockFailedURL) {
                    SD_LOCK(self->_failedURLsLock);
                    [self.failedURLs addObject:url];
                    SD_UNLOCK(self->_failedURLsLock);
                }
            } else {
                if ((options & SDWebImageRetryFailed)) {
                    SD_LOCK(self->_failedURLsLock);
                    [self.failedURLs removeObject:url];
                    SD_UNLOCK(self->_failedURLsLock);
                }
                // Continue store cache process
                [self callStoreCacheProcessForOperation:operation url:url options:options context:context downloadedImage:downloadedImage downloadedData:downloadedData finished:finished progress:progressBlock completed:completedBlock];
            }
            
            if (finished) {
                [self safelyRemoveOperationFromRunning:operation];
            }
        }];
    } else if (cachedImage) {
        [self callCompletionBlockForOperation:operation completion:completedBlock image:cachedImage data:cachedData error:nil cacheType:cacheType finished:YES url:url];
        [self safelyRemoveOperationFromRunning:operation];
    } else {
        // Image not in cache and download disallowed by delegate
        [self callCompletionBlockForOperation:operation completion:completedBlock image:nil data:nil error:nil cacheType:SDImageCacheTypeNone finished:YES url:url];
        [self safelyRemoveOperationFromRunning:operation];
    }
}

// Store cache process
- (void)callStoreCacheProcessForOperation:(nonnull SDWebImageCombinedOperation *)operation
                                      url:(nonnull NSURL *)url
                                  options:(SDWebImageOptions)options
                                  context:(SDWebImageContext *)context
                          downloadedImage:(nullable UIImage *)downloadedImage
                           downloadedData:(nullable NSData *)downloadedData
                                 finished:(BOOL)finished
                                 progress:(nullable SDImageLoaderProgressBlock)progressBlock
                                completed:(nullable SDInternalCompletionBlock)completedBlock {
    // the target image store cache type
    SDImageCacheType storeCacheType = SDImageCacheTypeAll;
    if (context[SDWebImageContextStoreCacheType]) {
        storeCacheType = [context[SDWebImageContextStoreCacheType] integerValue];
    }
    // the original store image cache type
    SDImageCacheType originalStoreCacheType = SDImageCacheTypeNone;
    if (context[SDWebImageContextOriginalStoreCacheType]) {
        originalStoreCacheType = [context[SDWebImageContextOriginalStoreCacheType] integerValue];
    }
    // origin cache key
    SDWebImageMutableContext *originContext = [context mutableCopy];
    // disable transformer for cache key generation
    originContext[SDWebImageContextImageTransformer] = [NSNull null];
    NSString *key = [self cacheKeyForURL:url context:originContext];
    id<SDImageTransformer> transformer = context[SDWebImageContextImageTransformer];
    if (![transformer conformsToProtocol:@protocol(SDImageTransformer)]) {
        transformer = nil;
    }
    id<SDWebImageCacheSerializer> cacheSerializer = context[SDWebImageContextCacheSerializer];
    
    BOOL shouldTransformImage = downloadedImage && transformer;
    shouldTransformImage = shouldTransformImage && (!downloadedImage.sd_isAnimated || (options & SDWebImageTransformAnimatedImage));
    shouldTransformImage = shouldTransformImage && (!downloadedImage.sd_isVector || (options & SDWebImageTransformVectorImage));
    BOOL shouldCacheOriginal = downloadedImage && finished;
    
    // if available, store original image to cache
    if (shouldCacheOriginal) {
        // normally use the store cache type, but if target image is transformed, use original store cache type instead
        SDImageCacheType targetStoreCacheType = shouldTransformImage ? originalStoreCacheType : storeCacheType;
        if (cacheSerializer && (targetStoreCacheType == SDImageCacheTypeDisk || targetStoreCacheType == SDImageCacheTypeAll)) {
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
                @autoreleasepool {
                    NSData *cacheData = [cacheSerializer cacheDataWithImage:downloadedImage originalData:downloadedData imageURL:url];
                    [self storeImage:downloadedImage imageData:cacheData forKey:key cacheType:targetStoreCacheType options:options context:context completion:^{
                        // Continue transform process
                        [self callTransformProcessForOperation:operation url:url options:options context:context originalImage:downloadedImage originalData:downloadedData finished:finished progress:progressBlock completed:completedBlock];
                    }];
                }
            });
        } else {
            [self storeImage:downloadedImage imageData:downloadedData forKey:key cacheType:targetStoreCacheType options:options context:context completion:^{
                // Continue transform process
                [self callTransformProcessForOperation:operation url:url options:options context:context originalImage:downloadedImage originalData:downloadedData finished:finished progress:progressBlock completed:completedBlock];
            }];
        }
    } else {
        // Continue transform process
        [self callTransformProcessForOperation:operation url:url options:options context:context originalImage:downloadedImage originalData:downloadedData finished:finished progress:progressBlock completed:completedBlock];
    }
}

// Transform process
- (void)callTransformProcessForOperation:(nonnull SDWebImageCombinedOperation *)operation
                                     url:(nonnull NSURL *)url
                                 options:(SDWebImageOptions)options
                                 context:(SDWebImageContext *)context
                           originalImage:(nullable UIImage *)originalImage
                            originalData:(nullable NSData *)originalData
                                finished:(BOOL)finished
                                progress:(nullable SDImageLoaderProgressBlock)progressBlock
                               completed:(nullable SDInternalCompletionBlock)completedBlock {
    // the target image store cache type
    SDImageCacheType storeCacheType = SDImageCacheTypeAll;
    if (context[SDWebImageContextStoreCacheType]) {
        storeCacheType = [context[SDWebImageContextStoreCacheType] integerValue];
    }
    // transformed cache key
    NSString *key = [self cacheKeyForURL:url context:context];
    id<SDImageTransformer> transformer = context[SDWebImageContextImageTransformer];
    if (![transformer conformsToProtocol:@protocol(SDImageTransformer)]) {
        transformer = nil;
    }
    id<SDWebImageCacheSerializer> cacheSerializer = context[SDWebImageContextCacheSerializer];
    
    BOOL shouldTransformImage = originalImage && transformer;
    shouldTransformImage = shouldTransformImage && (!originalImage.sd_isAnimated || (options & SDWebImageTransformAnimatedImage));
    shouldTransformImage = shouldTransformImage && (!originalImage.sd_isVector || (options & SDWebImageTransformVectorImage));
    // if available, store transformed image to cache
    if (shouldTransformImage) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
            @autoreleasepool {
                UIImage *transformedImage = [transformer transformedImageWithImage:originalImage forKey:key];
                if (transformedImage && finished) {
                    BOOL imageWasTransformed = ![transformedImage isEqual:originalImage];
                    NSData *cacheData;
                    // pass nil if the image was transformed, so we can recalculate the data from the image
                    if (cacheSerializer && (storeCacheType == SDImageCacheTypeDisk || storeCacheType == SDImageCacheTypeAll)) {
                        cacheData = [cacheSerializer cacheDataWithImage:transformedImage originalData:(imageWasTransformed ? nil : originalData) imageURL:url];
                    } else {
                        cacheData = (imageWasTransformed ? nil : originalData);
                    }
                    [self storeImage:transformedImage imageData:cacheData forKey:key cacheType:storeCacheType options:options context:context completion:^{
                        [self callCompletionBlockForOperation:operation completion:completedBlock image:transformedImage data:originalData error:nil cacheType:SDImageCacheTypeNone finished:finished url:url];
                    }];
                } else {
                    [self callCompletionBlockForOperation:operation completion:completedBlock image:transformedImage data:originalData error:nil cacheType:SDImageCacheTypeNone finished:finished url:url];
                }
            }
        });
    } else {
        [self callCompletionBlockForOperation:operation completion:completedBlock image:originalImage data:originalData error:nil cacheType:SDImageCacheTypeNone finished:finished url:url];
    }
}

#pragma mark - Helper

- (void)safelyRemoveOperationFromRunning:(nullable SDWebImageCombinedOperation*)operation {
    if (!operation) {
        return;
    }
    SD_LOCK(_runningOperationsLock);
    [self.runningOperations removeObject:operation];
    SD_UNLOCK(_runningOperationsLock);
}

- (void)storeImage:(nullable UIImage *)image
         imageData:(nullable NSData *)data
            forKey:(nullable NSString *)key
         cacheType:(SDImageCacheType)cacheType
           options:(SDWebImageOptions)options
           context:(nullable SDWebImageContext *)context
        completion:(nullable SDWebImageNoParamsBlock)completion {
    id<SDImageCache> imageCache;
    if ([context[SDWebImageContextImageCache] conformsToProtocol:@protocol(SDImageCache)]) {
        imageCache = context[SDWebImageContextImageCache];
    } else {
        imageCache = self.imageCache;
    }
    BOOL waitStoreCache = SD_OPTIONS_CONTAINS(options, SDWebImageWaitStoreCache);
    // Check whether we should wait the store cache finished. If not, callback immediately
    [imageCache storeImage:image imageData:data forKey:key cacheType:cacheType completion:^{
        if (waitStoreCache) {
            if (completion) {
                completion();
            }
        }
    }];
    if (!waitStoreCache) {
        if (completion) {
            completion();
        }
    }
}

- (void)callCompletionBlockForOperation:(nullable SDWebImageCombinedOperation*)operation
                             completion:(nullable SDInternalCompletionBlock)completionBlock
                                  error:(nullable NSError *)error
                                    url:(nullable NSURL *)url {
    [self callCompletionBlockForOperation:operation completion:completionBlock image:nil data:nil error:error cacheType:SDImageCacheTypeNone finished:YES url:url];
}

- (void)callCompletionBlockForOperation:(nullable SDWebImageCombinedOperation*)operation
                             completion:(nullable SDInternalCompletionBlock)completionBlock
                                  image:(nullable UIImage *)image
                                   data:(nullable NSData *)data
                                  error:(nullable NSError *)error
                              cacheType:(SDImageCacheType)cacheType
                               finished:(BOOL)finished
                                    url:(nullable NSURL *)url {
    dispatch_main_async_safe(^{
        if (completionBlock) {
            completionBlock(image, data, error, cacheType, finished, url);
        }
    });
}

- (BOOL)shouldBlockFailedURLWithURL:(nonnull NSURL *)url
                              error:(nonnull NSError *)error
                            options:(SDWebImageOptions)options
                            context:(nullable SDWebImageContext *)context {
    id<SDImageLoader> imageLoader;
    if ([context[SDWebImageContextImageLoader] conformsToProtocol:@protocol(SDImageLoader)]) {
        imageLoader = context[SDWebImageContextImageLoader];
    } else {
        imageLoader = self.imageLoader;
    }
    // Check whether we should block failed url
    BOOL shouldBlockFailedURL;
    if ([self.delegate respondsToSelector:@selector(imageManager:shouldBlockFailedURL:withError:)]) {
        shouldBlockFailedURL = [self.delegate imageManager:self shouldBlockFailedURL:url withError:error];
    } else {
        if ([imageLoader respondsToSelector:@selector(shouldBlockFailedURLWithURL:error:options:context:)]) {
            shouldBlockFailedURL = [imageLoader shouldBlockFailedURLWithURL:url error:error options:options context:context];
        } else {
            shouldBlockFailedURL = [imageLoader shouldBlockFailedURLWithURL:url error:error];
        }
    }
    
    return shouldBlockFailedURL;
}

- (SDWebImageOptionsResult *)processedResultForURL:(NSURL *)url options:(SDWebImageOptions)options context:(SDWebImageContext *)context {
    SDWebImageOptionsResult *result;
    SDWebImageMutableContext *mutableContext = [SDWebImageMutableContext dictionary];
    
    // Image Transformer from manager
    if (!context[SDWebImageContextImageTransformer]) {
        id<SDImageTransformer> transformer = self.transformer;
        [mutableContext setValue:transformer forKey:SDWebImageContextImageTransformer];
    }
    // Cache key filter from manager
    if (!context[SDWebImageContextCacheKeyFilter]) {
        id<SDWebImageCacheKeyFilter> cacheKeyFilter = self.cacheKeyFilter;
        [mutableContext setValue:cacheKeyFilter forKey:SDWebImageContextCacheKeyFilter];
    }
    // Cache serializer from manager
    if (!context[SDWebImageContextCacheSerializer]) {
        id<SDWebImageCacheSerializer> cacheSerializer = self.cacheSerializer;
        [mutableContext setValue:cacheSerializer forKey:SDWebImageContextCacheSerializer];
    }
    
    if (mutableContext.count > 0) {
        if (context) {
            [mutableContext addEntriesFromDictionary:context];
        }
        context = [mutableContext copy];
    }
    
    // Apply options processor
    if (self.optionsProcessor) {
        result = [self.optionsProcessor processedResultForURL:url options:options context:context];
    }
    if (!result) {
        // Use default options result
        result = [[SDWebImageOptionsResult alloc] initWithOptions:options context:context];
    }
    
    return result;
}

@end


@implementation SDWebImageCombinedOperation

- (void)cancel {
    @synchronized(self) {
        if (self.isCancelled) {
            return;
        }
        self.cancelled = YES;
        if (self.cacheOperation) {
            [self.cacheOperation cancel];
            self.cacheOperation = nil;
        }
        if (self.loaderOperation) {
            [self.loaderOperation cancel];
            self.loaderOperation = nil;
        }
        [self.manager safelyRemoveOperationFromRunning:self];
    }
}

@end
