/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <stdatomic.h>
#import <objc/runtime.h>

#import <ImageIO/ImageIO.h>

#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTDefines.h>
#import <ReactABI28_0_0/ABI28_0_0RCTImageLoader.h>
#import <ReactABI28_0_0/ABI28_0_0RCTLog.h>
#import <ReactABI28_0_0/ABI28_0_0RCTNetworking.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>

#import "ABI28_0_0RCTImageCache.h"
#import "ABI28_0_0RCTImageUtils.h"

@implementation UIImage (ReactABI28_0_0)

- (CAKeyframeAnimation *)ReactABI28_0_0KeyframeAnimation
{
    return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI28_0_0KeyframeAnimation:(CAKeyframeAnimation *)ReactABI28_0_0KeyframeAnimation
{
    objc_setAssociatedObject(self, @selector(ReactABI28_0_0KeyframeAnimation), ReactABI28_0_0KeyframeAnimation, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@implementation ABI28_0_0RCTImageLoader
{
    NSArray<id<ABI28_0_0RCTImageURLLoader>> *_loaders;
    NSArray<id<ABI28_0_0RCTImageDataDecoder>> *_decoders;
    NSOperationQueue *_imageDecodeQueue;
    dispatch_queue_t _URLRequestQueue;
    id<ABI28_0_0RCTImageCache> _imageCache;
    NSMutableArray *_pendingTasks;
    NSInteger _activeTasks;
    NSMutableArray *_pendingDecodes;
    NSInteger _scheduledDecodes;
    NSUInteger _activeBytes;
  __weak id<ABI28_0_0RCTImageRedirectProtocol> _redirectDelegate;
}

@synthesize bridge = _bridge;

ABI28_0_0RCT_EXPORT_MODULE()

- (instancetype)init
{
  return [self initWithRedirectDelegate:nil];
}

- (instancetype)initWithRedirectDelegate:(id<ABI28_0_0RCTImageRedirectProtocol>)redirectDelegate
{
    if (self = [super init]) {
        _redirectDelegate = redirectDelegate;
    }
    return self;
}

- (void)setUp
{
    // Set defaults
    _maxConcurrentLoadingTasks = _maxConcurrentLoadingTasks ?: 4;
    _maxConcurrentDecodingTasks = _maxConcurrentDecodingTasks ?: 2;
    _maxConcurrentDecodingBytes = _maxConcurrentDecodingBytes ?: 30 * 1024 * 1024; // 30MB

    _URLRequestQueue = dispatch_queue_create("com.facebook.ReactABI28_0_0.ImageLoaderURLRequestQueue", DISPATCH_QUEUE_SERIAL);
}

- (float)handlerPriority
{
    return 2;
}

- (id<ABI28_0_0RCTImageCache>)imageCache
{
    if (!_imageCache) {
        //set up with default cache
        _imageCache = [ABI28_0_0RCTImageCache new];
    }
    return _imageCache;
}

- (void)setImageCache:(id<ABI28_0_0RCTImageCache>)cache
{
    if (_imageCache) {
        ABI28_0_0RCTLogWarn(@"ABI28_0_0RCTImageCache was already set and has now been overriden.");
    }
    _imageCache = cache;
}

- (id<ABI28_0_0RCTImageURLLoader>)imageURLLoaderForURL:(NSURL *)URL
{
    if (!_maxConcurrentLoadingTasks) {
        [self setUp];
    }

    if (!_loaders) {
        // Get loaders, sorted in reverse priority order (highest priority first)
        ABI28_0_0RCTAssert(_bridge, @"Bridge not set");
        _loaders = [[_bridge modulesConformingToProtocol:@protocol(ABI28_0_0RCTImageURLLoader)] sortedArrayUsingComparator:^NSComparisonResult(id<ABI28_0_0RCTImageURLLoader> a, id<ABI28_0_0RCTImageURLLoader> b) {
            float priorityA = [a respondsToSelector:@selector(loaderPriority)] ? [a loaderPriority] : 0;
            float priorityB = [b respondsToSelector:@selector(loaderPriority)] ? [b loaderPriority] : 0;
            if (priorityA > priorityB) {
                return NSOrderedAscending;
            } else if (priorityA < priorityB) {
                return NSOrderedDescending;
            } else {
                return NSOrderedSame;
            }
        }];
    }

    if (ABI28_0_0RCT_DEBUG) {
        // Check for handler conflicts
        float previousPriority = 0;
        id<ABI28_0_0RCTImageURLLoader> previousLoader = nil;
        for (id<ABI28_0_0RCTImageURLLoader> loader in _loaders) {
            float priority = [loader respondsToSelector:@selector(loaderPriority)] ? [loader loaderPriority] : 0;
            if (previousLoader && priority < previousPriority) {
                return previousLoader;
            }
            if ([loader canLoadImageURL:URL]) {
                if (previousLoader) {
                    if (priority == previousPriority) {
                        ABI28_0_0RCTLogError(@"The ABI28_0_0RCTImageURLLoaders %@ and %@ both reported that"
                                    " they can load the URL %@, and have equal priority"
                                    " (%g). This could result in non-deterministic behavior.",
                                    loader, previousLoader, URL, priority);
                    }
                } else {
                    previousLoader = loader;
                    previousPriority = priority;
                }
            }
        }
        return previousLoader;
    }

    // Normal code path
    for (id<ABI28_0_0RCTImageURLLoader> loader in _loaders) {
        if ([loader canLoadImageURL:URL]) {
            return loader;
        }
    }
    return nil;
}

- (id<ABI28_0_0RCTImageDataDecoder>)imageDataDecoderForData:(NSData *)data
{
    if (!_maxConcurrentLoadingTasks) {
        [self setUp];
    }

    if (!_decoders) {
        // Get decoders, sorted in reverse priority order (highest priority first)
        ABI28_0_0RCTAssert(_bridge, @"Bridge not set");
        _decoders = [[_bridge modulesConformingToProtocol:@protocol(ABI28_0_0RCTImageDataDecoder)] sortedArrayUsingComparator:^NSComparisonResult(id<ABI28_0_0RCTImageDataDecoder> a, id<ABI28_0_0RCTImageDataDecoder> b) {
            float priorityA = [a respondsToSelector:@selector(decoderPriority)] ? [a decoderPriority] : 0;
            float priorityB = [b respondsToSelector:@selector(decoderPriority)] ? [b decoderPriority] : 0;
            if (priorityA > priorityB) {
                return NSOrderedAscending;
            } else if (priorityA < priorityB) {
                return NSOrderedDescending;
            } else {
                return NSOrderedSame;
            }
        }];
    }

    if (ABI28_0_0RCT_DEBUG) {
        // Check for handler conflicts
        float previousPriority = 0;
        id<ABI28_0_0RCTImageDataDecoder> previousDecoder = nil;
        for (id<ABI28_0_0RCTImageDataDecoder> decoder in _decoders) {
            float priority = [decoder respondsToSelector:@selector(decoderPriority)] ? [decoder decoderPriority] : 0;
            if (previousDecoder && priority < previousPriority) {
                return previousDecoder;
            }
            if ([decoder canDecodeImageData:data]) {
                if (previousDecoder) {
                    if (priority == previousPriority) {
                        ABI28_0_0RCTLogError(@"The ABI28_0_0RCTImageDataDecoders %@ and %@ both reported that"
                                    " they can decode the data <NSData %p; %tu bytes>, and"
                                    " have equal priority (%g). This could result in"
                                    " non-deterministic behavior.",
                                    decoder, previousDecoder, data, data.length, priority);
                    }
                } else {
                    previousDecoder = decoder;
                    previousPriority = priority;
                }
            }
        }
        return previousDecoder;
    }

    // Normal code path
    for (id<ABI28_0_0RCTImageDataDecoder> decoder in _decoders) {
        if ([decoder canDecodeImageData:data]) {
            return decoder;
        }
    }
    return nil;
}

static UIImage *ABI28_0_0RCTResizeImageIfNeeded(UIImage *image,
                                       CGSize size,
                                       CGFloat scale,
                                       ABI28_0_0RCTResizeMode resizeMode)
{
    if (CGSizeEqualToSize(size, CGSizeZero) ||
        CGSizeEqualToSize(image.size, CGSizeZero) ||
        CGSizeEqualToSize(image.size, size)) {
        return image;
    }
    CAKeyframeAnimation *animation = image.ReactABI28_0_0KeyframeAnimation;
    CGRect targetSize = ABI28_0_0RCTTargetRect(image.size, size, scale, resizeMode);
    CGAffineTransform transform = ABI28_0_0RCTTransformFromTargetRect(image.size, targetSize);
    image = ABI28_0_0RCTTransformImage(image, size, scale, transform);
    image.ReactABI28_0_0KeyframeAnimation = animation;
    return image;
}

- (ABI28_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                  callback:(ABI28_0_0RCTImageLoaderCompletionBlock)callback
{
    return [self loadImageWithURLRequest:imageURLRequest
                                    size:CGSizeZero
                                   scale:1
                                 clipped:YES
                              resizeMode:ABI28_0_0RCTResizeModeStretch
                           progressBlock:nil
                        partialLoadBlock:nil
                         completionBlock:callback];
}

- (void)dequeueTasks
{
    dispatch_async(_URLRequestQueue, ^{
        // Remove completed tasks
        NSMutableArray *tasksToRemove = nil;
        for (ABI28_0_0RCTNetworkTask *task in self->_pendingTasks.reverseObjectEnumerator) {
            switch (task.status) {
                case ABI28_0_0RCTNetworkTaskFinished:
                    if (!tasksToRemove) {
                        tasksToRemove = [NSMutableArray new];
                    }
                    [tasksToRemove addObject:task];
                    self->_activeTasks--;
                    break;
                case ABI28_0_0RCTNetworkTaskPending:
                    break;
                case ABI28_0_0RCTNetworkTaskInProgress:
                    // Check task isn't "stuck"
                    if (task.requestToken == nil) {
                        ABI28_0_0RCTLogWarn(@"Task orphaned for request %@", task.request);
                        if (!tasksToRemove) {
                            tasksToRemove = [NSMutableArray new];
                        }
                        [tasksToRemove addObject:task];
                        self->_activeTasks--;
                        [task cancel];
                    }
                    break;
            }
        }

        if (tasksToRemove) {
            [self->_pendingTasks removeObjectsInArray:tasksToRemove];
        }

        // Start queued decode
        NSInteger activeDecodes = self->_scheduledDecodes - self->_pendingDecodes.count;
        while (activeDecodes == 0 || (self->_activeBytes <= self->_maxConcurrentDecodingBytes &&
                                      activeDecodes <= self->_maxConcurrentDecodingTasks)) {
            dispatch_block_t decodeBlock = self->_pendingDecodes.firstObject;
            if (decodeBlock) {
                [self->_pendingDecodes removeObjectAtIndex:0];
                decodeBlock();
            } else {
                break;
            }
        }

        // Start queued tasks
        for (ABI28_0_0RCTNetworkTask *task in self->_pendingTasks) {
            if (MAX(self->_activeTasks, self->_scheduledDecodes) >= self->_maxConcurrentLoadingTasks) {
                break;
            }
            if (task.status == ABI28_0_0RCTNetworkTaskPending) {
                [task start];
                self->_activeTasks++;
            }
        }
    });
}

/**
 * This returns either an image, or raw image data, depending on the loading
 * path taken. This is useful if you want to skip decoding, e.g. when preloading
 * the image, or retrieving metadata.
 */
- (ABI28_0_0RCTImageLoaderCancellationBlock)_loadImageOrDataWithURLRequest:(NSURLRequest *)request
                                                             size:(CGSize)size
                                                            scale:(CGFloat)scale
                                                       resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
                                                    progressBlock:(ABI28_0_0RCTImageLoaderProgressBlock)progressHandler
                                                 partialLoadBlock:(ABI28_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                                  completionBlock:(void (^)(NSError *error, id imageOrData, BOOL cacheResult, NSString *fetchDate))completionBlock
{
    {
        NSMutableURLRequest *mutableRequest = [request mutableCopy];
        [NSURLProtocol setProperty:@"ABI28_0_0RCTImageLoader"
                            forKey:@"trackingName"
                         inRequest:mutableRequest];

        // Add missing png extension
        if (request.URL.fileURL && request.URL.pathExtension.length == 0) {
            mutableRequest.URL = [request.URL URLByAppendingPathExtension:@"png"];
        }
        if (_redirectDelegate != nil) {
            mutableRequest.URL = [_redirectDelegate redirectAssetsURL:mutableRequest.URL];
        }
        request = mutableRequest;
    }

    // Find suitable image URL loader
    id<ABI28_0_0RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:request.URL];
    BOOL requiresScheduling = [loadHandler respondsToSelector:@selector(requiresScheduling)] ?
    [loadHandler requiresScheduling] : YES;

    __block atomic_bool cancelled = ATOMIC_VAR_INIT(NO);
    // TODO: Protect this variable shared between threads.
    __block dispatch_block_t cancelLoad = nil;
    void (^completionHandler)(NSError *, id, NSString *) = ^(NSError *error, id imageOrData, NSString *fetchDate) {
        cancelLoad = nil;

        BOOL cacheResult = [loadHandler respondsToSelector:@selector(shouldCacheLoadedImages)] ?
        [loadHandler shouldCacheLoadedImages] : YES;

        // If we've received an image, we should try to set it synchronously,
        // if it's data, do decoding on a background thread.
        if (ABI28_0_0RCTIsMainQueue() && ![imageOrData isKindOfClass:[UIImage class]]) {
            // Most loaders do not return on the main thread, so caller is probably not
            // expecting it, and may do expensive post-processing in the callback
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                if (!atomic_load(&cancelled)) {
                    completionBlock(error, imageOrData, cacheResult, fetchDate);
                }
            });
        } else if (!atomic_load(&cancelled)) {
            completionBlock(error, imageOrData, cacheResult, fetchDate);
        }
    };

    // If the loader doesn't require scheduling we call it directly on
    // the main queue.
    if (loadHandler && !requiresScheduling) {
        return [loadHandler loadImageForURL:request.URL
                                       size:size
                                      scale:scale
                                 resizeMode:resizeMode
                            progressHandler:progressHandler
                         partialLoadHandler:partialLoadHandler
                          completionHandler:^(NSError *error, UIImage *image){
                              completionHandler(error, image, nil);
                          }];
    }

    // All access to URL cache must be serialized
    if (!_URLRequestQueue) {
        [self setUp];
    }

    __weak ABI28_0_0RCTImageLoader *weakSelf = self;
    dispatch_async(_URLRequestQueue, ^{
        __typeof(self) strongSelf = weakSelf;
        if (atomic_load(&cancelled) || !strongSelf) {
            return;
        }

        if (loadHandler) {
            cancelLoad = [loadHandler loadImageForURL:request.URL
                                                 size:size
                                                scale:scale
                                           resizeMode:resizeMode
                                      progressHandler:progressHandler
                                   partialLoadHandler:partialLoadHandler
                                    completionHandler:^(NSError *error, UIImage *image) {
                                        completionHandler(error, image, nil);
                                    }];
        } else {
            // Use networking module to load image
            cancelLoad = [strongSelf _loadURLRequest:request
                                       progressBlock:progressHandler
                                     completionBlock:completionHandler];
        }
    });

    return ^{
        BOOL alreadyCancelled = atomic_fetch_or(&cancelled, 1);
        if (alreadyCancelled) {
            return;
        }
        dispatch_block_t cancelLoadLocal = cancelLoad;
        cancelLoad = nil;
        if (cancelLoadLocal) {
            cancelLoadLocal();
        }
    };
}

- (ABI28_0_0RCTImageLoaderCancellationBlock)_loadURLRequest:(NSURLRequest *)request
                                     progressBlock:(ABI28_0_0RCTImageLoaderProgressBlock)progressHandler
                                   completionBlock:(void (^)(NSError *error, id imageOrData, NSString *fetchDate))completionHandler
{
    // Check if networking module is available
    if (ABI28_0_0RCT_DEBUG && ![_bridge respondsToSelector:@selector(networking)]) {
        ABI28_0_0RCTLogError(@"No suitable image URL loader found for %@. You may need to "
                    " import the ABI28_0_0RCTNetwork library in order to load images.",
                    request.URL.absoluteString);
        return NULL;
    }

    ABI28_0_0RCTNetworking *networking = [_bridge networking];

    // Check if networking module can load image
    if (ABI28_0_0RCT_DEBUG && ![networking canHandleRequest:request]) {
        ABI28_0_0RCTLogError(@"No suitable image URL loader found for %@", request.URL.absoluteString);
        return NULL;
    }

    // Use networking module to load image
    ABI28_0_0RCTURLRequestCompletionBlock processResponse = ^(NSURLResponse *response, NSData *data, NSError *error) {
        // Check for system errors
        if (error) {
            completionHandler(error, nil, nil);
            return;
        } else if (!response) {
            completionHandler(ABI28_0_0RCTErrorWithMessage(@"Response metadata error"), nil, nil);
            return;
        } else if (!data) {
            completionHandler(ABI28_0_0RCTErrorWithMessage(@"Unknown image download error"), nil, nil);
            return;
        }

        // Check for http errors
        NSString *responseDate;
        if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
            NSInteger statusCode = ((NSHTTPURLResponse *)response).statusCode;
            if (statusCode != 200) {
                NSString *errorMessage = [NSString stringWithFormat:@"Failed to load %@", response.URL];
                NSDictionary *userInfo = @{NSLocalizedDescriptionKey: errorMessage};
                completionHandler([[NSError alloc] initWithDomain:NSURLErrorDomain
                                                             code:statusCode
                                                         userInfo:userInfo], nil, nil);
                return;
            }

            responseDate = ((NSHTTPURLResponse *)response).allHeaderFields[@"Date"];
        }

        // Call handler
        completionHandler(nil, data, responseDate);
    };

    // Download image
    __weak __typeof(self) weakSelf = self;
    __block ABI28_0_0RCTNetworkTask *task =
    [networking networkTaskWithRequest:request
                       completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
                           __typeof(self) strongSelf = weakSelf;
                           if (!strongSelf) {
                               return;
                           }

                           if (error || !response || !data) {
                               NSError *someError = nil;
                               if (error) {
                                   someError = error;
                               } else if (!response) {
                                   someError = ABI28_0_0RCTErrorWithMessage(@"Response metadata error");
                               } else {
                                   someError = ABI28_0_0RCTErrorWithMessage(@"Unknown image download error");
                               }
                               completionHandler(someError, nil, nil);
                               [strongSelf dequeueTasks];
                               return;
                           }

                           dispatch_async(strongSelf->_URLRequestQueue, ^{
                               // Process image data
                               processResponse(response, data, nil);

                               // Prepare for next task
                               [strongSelf dequeueTasks];
                           });
                       }];

    task.downloadProgressBlock = ^(int64_t progress, int64_t total) {
        if (progressHandler) {
            progressHandler(progress, total);
        }
    };

    if (task) {
        if (!_pendingTasks) {
            _pendingTasks = [NSMutableArray new];
        }
        [_pendingTasks addObject:task];
        [self dequeueTasks];
    }

    return ^{
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf || !task) {
            return;
        }
        dispatch_async(strongSelf->_URLRequestQueue, ^{
            [task cancel];
            task = nil;
        });
        [strongSelf dequeueTasks];
    };
}

- (ABI28_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                      size:(CGSize)size
                                                     scale:(CGFloat)scale
                                                   clipped:(BOOL)clipped
                                                resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
                                             progressBlock:(ABI28_0_0RCTImageLoaderProgressBlock)progressBlock
                                          partialLoadBlock:(ABI28_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                           completionBlock:(ABI28_0_0RCTImageLoaderCompletionBlock)completionBlock
{
    __block atomic_bool cancelled = ATOMIC_VAR_INIT(NO);
    // TODO: Protect this variable shared between threads.
    __block dispatch_block_t cancelLoad = nil;
    dispatch_block_t cancellationBlock = ^{
        BOOL alreadyCancelled = atomic_fetch_or(&cancelled, 1);
        if (alreadyCancelled) {
            return;
        }
        dispatch_block_t cancelLoadLocal = cancelLoad;
        cancelLoad = nil;
        if (cancelLoadLocal) {
            cancelLoadLocal();
        }
    };

    __weak ABI28_0_0RCTImageLoader *weakSelf = self;
    void (^completionHandler)(NSError *, id, BOOL, NSString *) = ^(NSError *error, id imageOrData, BOOL cacheResult, NSString *fetchDate) {
        __typeof(self) strongSelf = weakSelf;
        if (atomic_load(&cancelled) || !strongSelf) {
            return;
        }

        if (!imageOrData || [imageOrData isKindOfClass:[UIImage class]]) {
            cancelLoad = nil;
            completionBlock(error, imageOrData);
            return;
        }

        // Check decoded image cache
        if (cacheResult) {
            UIImage *image = [[strongSelf imageCache] imageForUrl:imageURLRequest.URL.absoluteString
                                                             size:size
                                                            scale:scale
                                                       resizeMode:resizeMode
                                                     responseDate:fetchDate];
            if (image) {
                cancelLoad = nil;
                completionBlock(nil, image);
                return;
            }
        }

        ABI28_0_0RCTImageLoaderCompletionBlock decodeCompletionHandler = ^(NSError *error_, UIImage *image) {
            if (cacheResult && image) {
                // Store decoded image in cache
                [[strongSelf imageCache] addImageToCache:image
                                                     URL:imageURLRequest.URL.absoluteString
                                                    size:size
                                                   scale:scale
                                              resizeMode:resizeMode
                                            responseDate:fetchDate];
            }

            cancelLoad = nil;
            completionBlock(error_, image);
        };

        cancelLoad = [strongSelf decodeImageData:imageOrData
                                            size:size
                                           scale:scale
                                         clipped:clipped
                                      resizeMode:resizeMode
                                 completionBlock:decodeCompletionHandler];
    };

    cancelLoad = [self _loadImageOrDataWithURLRequest:imageURLRequest
                                                 size:size
                                                scale:scale
                                           resizeMode:resizeMode
                                        progressBlock:progressBlock
                                     partialLoadBlock:partialLoadBlock
                                      completionBlock:completionHandler];
    return cancellationBlock;
}

- (ABI28_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)data
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                           clipped:(BOOL)clipped
                                        resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
                                   completionBlock:(ABI28_0_0RCTImageLoaderCompletionBlock)completionBlock
{
    if (data.length == 0) {
        completionBlock(ABI28_0_0RCTErrorWithMessage(@"No image data"), nil);
        return ^{};
    }

    __block atomic_bool cancelled = ATOMIC_VAR_INIT(NO);
    void (^completionHandler)(NSError *, UIImage *) = ^(NSError *error, UIImage *image) {
        if (ABI28_0_0RCTIsMainQueue()) {
            // Most loaders do not return on the main thread, so caller is probably not
            // expecting it, and may do expensive post-processing in the callback
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                if (!atomic_load(&cancelled)) {
                    completionBlock(error, clipped ? ABI28_0_0RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
                }
            });
        } else if (!atomic_load(&cancelled)) {
            completionBlock(error, clipped ? ABI28_0_0RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
        }
    };

    id<ABI28_0_0RCTImageDataDecoder> imageDecoder = [self imageDataDecoderForData:data];
    if (imageDecoder) {
        return [imageDecoder decodeImageData:data
                                        size:size
                                       scale:scale
                                  resizeMode:resizeMode
                           completionHandler:completionHandler] ?: ^{};
    } else {
        dispatch_block_t decodeBlock = ^{
            // Calculate the size, in bytes, that the decompressed image will require
            NSInteger decodedImageBytes = (size.width * scale) * (size.height * scale) * 4;

            // Mark these bytes as in-use
            self->_activeBytes += decodedImageBytes;

            // Do actual decompression on a concurrent background queue
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                if (!atomic_load(&cancelled)) {

                    // Decompress the image data (this may be CPU and memory intensive)
                    UIImage *image = ABI28_0_0RCTDecodeImageWithData(data, size, scale, resizeMode);

#if ABI28_0_0RCT_DEV
                    CGSize imagePixelSize = ABI28_0_0RCTSizeInPixels(image.size, image.scale);
                    CGSize screenPixelSize = ABI28_0_0RCTSizeInPixels(ABI28_0_0RCTScreenSize(), ABI28_0_0RCTScreenScale());
                    if (imagePixelSize.width * imagePixelSize.height >
                        screenPixelSize.width * screenPixelSize.height) {
                        ABI28_0_0RCTLogInfo(@"[PERF ASSETS] Loading image at size %@, which is larger "
                                   "than the screen size %@", NSStringFromCGSize(imagePixelSize),
                                   NSStringFromCGSize(screenPixelSize));
                    }
#endif

                    if (image) {
                        completionHandler(nil, image);
                    } else {
                        NSString *errorMessage = [NSString stringWithFormat:@"Error decoding image data <NSData %p; %tu bytes>", data, data.length];
                        NSError *finalError = ABI28_0_0RCTErrorWithMessage(errorMessage);
                        completionHandler(finalError, nil);
                    }
                }

                // We're no longer retaining the uncompressed data, so now we'll mark
                // the decoding as complete so that the loading task queue can resume.
                dispatch_async(self->_URLRequestQueue, ^{
                    self->_scheduledDecodes--;
                    self->_activeBytes -= decodedImageBytes;
                    [self dequeueTasks];
                });
            });
        };

        if (!_URLRequestQueue) {
            [self setUp];
        }
        dispatch_async(_URLRequestQueue, ^{
            // The decode operation retains the compressed image data until it's
            // complete, so we'll mark it as having started, in order to block
            // further image loads from happening until we're done with the data.
            self->_scheduledDecodes++;

            if (!self->_pendingDecodes) {
                self->_pendingDecodes = [NSMutableArray new];
            }
            NSInteger activeDecodes = self->_scheduledDecodes - self->_pendingDecodes.count - 1;
            if (activeDecodes == 0 || (self->_activeBytes <= self->_maxConcurrentDecodingBytes &&
                                       activeDecodes <= self->_maxConcurrentDecodingTasks)) {
                decodeBlock();
            } else {
                [self->_pendingDecodes addObject:decodeBlock];
            }
        });

        return ^{
            atomic_store(&cancelled, YES);
        };
    }
}

- (ABI28_0_0RCTImageLoaderCancellationBlock)getImageSizeForURLRequest:(NSURLRequest *)imageURLRequest
                                                       block:(void(^)(NSError *error, CGSize size))callback
{
    void (^completion)(NSError *, id, BOOL, NSString *) = ^(NSError *error, id imageOrData, BOOL cacheResult, NSString *fetchDate) {
        CGSize size;
        if ([imageOrData isKindOfClass:[NSData class]]) {
            NSDictionary *meta = ABI28_0_0RCTGetImageMetadata(imageOrData);

            NSInteger imageOrientation = [meta[(id)kCGImagePropertyOrientation] integerValue];
            switch (imageOrientation) {
                case kCGImagePropertyOrientationLeft:
                case kCGImagePropertyOrientationRight:
                case kCGImagePropertyOrientationLeftMirrored:
                case kCGImagePropertyOrientationRightMirrored:
                    // swap width and height
                    size = (CGSize){
                      [meta[(id)kCGImagePropertyPixelHeight] doubleValue],
                      [meta[(id)kCGImagePropertyPixelWidth] doubleValue],
                    };
                    break;
                case kCGImagePropertyOrientationUp:
                case kCGImagePropertyOrientationDown:
                case kCGImagePropertyOrientationUpMirrored:
                case kCGImagePropertyOrientationDownMirrored:
                default:
                    size = (CGSize){
                      [meta[(id)kCGImagePropertyPixelWidth] doubleValue],
                      [meta[(id)kCGImagePropertyPixelHeight] doubleValue],
                    };
                    break;
            }
        } else {
            UIImage *image = imageOrData;
            size = (CGSize){
                image.size.width * image.scale,
                image.size.height * image.scale,
            };
        }
        callback(error, size);
    };

    return [self _loadImageOrDataWithURLRequest:imageURLRequest
                                           size:CGSizeZero
                                          scale:1
                                     resizeMode:ABI28_0_0RCTResizeModeStretch
                                  progressBlock:NULL
                               partialLoadBlock:NULL
                                completionBlock:completion];
}

#pragma mark - ABI28_0_0RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
    NSURL *requestURL = request.URL;

    // If the data being loaded is a video, return NO
    // Even better may be to implement this on the ABI28_0_0RCTImageURLLoader that would try to load it,
    // but we'd have to run the logic both in ABI28_0_0RCTPhotoLibraryImageLoader and
    // ABI28_0_0RCTAssetsLibraryRequestHandler. Once we drop iOS7 though, we'd drop
    // ABI28_0_0RCTAssetsLibraryRequestHandler and can move it there.
    static NSRegularExpression *videoRegex = nil;
    if (!videoRegex) {
      NSError *error = nil;
      videoRegex = [NSRegularExpression regularExpressionWithPattern:@"(?:&|^)ext=MOV(?:&|$)"
                                                             options:NSRegularExpressionCaseInsensitive
                                                               error:&error];
      if (error) {
        ABI28_0_0RCTLogError(@"%@", error);
      }
    }

    NSString *query = requestURL.query;
    if (query != nil && [videoRegex firstMatchInString:query
                                               options:0
                                                 range:NSMakeRange(0, query.length)]) {
      return NO;
    }

    for (id<ABI28_0_0RCTImageURLLoader> loader in _loaders) {
        // Don't use ABI28_0_0RCTImageURLLoader protocol for modules that already conform to
        // ABI28_0_0RCTURLRequestHandler as it's inefficient to decode an image and then
        // convert it back into data
        if (![loader conformsToProtocol:@protocol(ABI28_0_0RCTURLRequestHandler)] &&
            [loader canLoadImageURL:requestURL]) {
            return YES;
        }
    }
    return NO;
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<ABI28_0_0RCTURLRequestDelegate>)delegate
{
    __block ABI28_0_0RCTImageLoaderCancellationBlock requestToken;
    requestToken = [self loadImageWithURLRequest:request callback:^(NSError *error, UIImage *image) {
        if (error) {
            [delegate URLRequest:requestToken didCompleteWithError:error];
            return;
        }

        NSString *mimeType = nil;
        NSData *imageData = nil;
        if (ABI28_0_0RCTImageHasAlpha(image.CGImage)) {
            mimeType = @"image/png";
            imageData = UIImagePNGRepresentation(image);
        } else {
            mimeType = @"image/jpeg";
            imageData = UIImageJPEGRepresentation(image, 1.0);
        }

        NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                            MIMEType:mimeType
                                               expectedContentLength:imageData.length
                                                    textEncodingName:nil];

        [delegate URLRequest:requestToken didReceiveResponse:response];
        [delegate URLRequest:requestToken didReceiveData:imageData];
        [delegate URLRequest:requestToken didCompleteWithError:nil];
    }];

    return requestToken;
}

- (void)cancelRequest:(id)requestToken
{
    if (requestToken) {
        ((ABI28_0_0RCTImageLoaderCancellationBlock)requestToken)();
    }
}

@end

@implementation ABI28_0_0RCTBridge (ABI28_0_0RCTImageLoader)

- (ABI28_0_0RCTImageLoader *)imageLoader
{
    return [self moduleForClass:[ABI28_0_0RCTImageLoader class]];
}

@end
