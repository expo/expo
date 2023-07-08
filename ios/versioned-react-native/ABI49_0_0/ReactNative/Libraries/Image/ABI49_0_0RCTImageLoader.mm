/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <mach/mach_time.h>
#import <objc/runtime.h>
#import <atomic>

#import <ImageIO/ImageIO.h>

#import <ABI49_0_0FBReactNativeSpec/ABI49_0_0FBReactNativeSpec.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageCache.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageLoader.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageUtils.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import <ABI49_0_0React/ABI49_0_0RCTNetworking.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>

#import "ABI49_0_0RCTImagePlugins.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;

static BOOL imagePerfInstrumentationEnabled = NO;

BOOL ABI49_0_0RCTImageLoadingPerfInstrumentationEnabled(void)
{
  return imagePerfInstrumentationEnabled;
}

void ABI49_0_0RCTEnableImageLoadingPerfInstrumentation(BOOL enabled)
{
  imagePerfInstrumentationEnabled = enabled;
}

static NSInteger ABI49_0_0RCTImageBytesForImage(UIImage *image)
{
  NSInteger singleImageBytes = (NSInteger)(image.size.width * image.size.height * image.scale * image.scale * 4);
  return image.images ? image.images.count * singleImageBytes : singleImageBytes;
}

static uint64_t monotonicTimeGetCurrentNanoseconds(void)
{
  static struct mach_timebase_info tb_info = {0};
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    __unused int ret = mach_timebase_info(&tb_info);
    assert(0 == ret);
  });

  return (mach_absolute_time() * tb_info.numer) / tb_info.denom;
}

static NSError *addResponseHeadersToError(NSError *originalError, NSHTTPURLResponse *response)
{
  NSMutableDictionary<NSString *, id> *_userInfo =
      (NSMutableDictionary<NSString *, id> *)originalError.userInfo.mutableCopy;
  _userInfo[@"httpStatusCode"] = [NSNumber numberWithInt:response.statusCode];
  _userInfo[@"httpResponseHeaders"] = response.allHeaderFields;
  NSError *error = [NSError errorWithDomain:originalError.domain code:originalError.code userInfo:_userInfo];

  return error;
}

@interface ABI49_0_0RCTImageLoader () <ABI49_0_0NativeImageLoaderIOSSpec, ABI49_0_0RCTImageLoaderWithAttributionProtocol>

@end

@implementation UIImage (ABI49_0_0React)

- (NSInteger)ABI49_0_0ReactDecodedImageBytes
{
  NSNumber *imageBytes = objc_getAssociatedObject(self, _cmd);
  if (!imageBytes) {
    imageBytes = @(ABI49_0_0RCTImageBytesForImage(self));
  }
  return [imageBytes integerValue];
}

- (void)setABI49_0_0ReactDecodedImageBytes:(NSInteger)bytes
{
  objc_setAssociatedObject(self, @selector(ABI49_0_0ReactDecodedImageBytes), @(bytes), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

@end

@implementation ABI49_0_0RCTImageLoader {
  NSArray<id<ABI49_0_0RCTImageURLLoader>> * (^_loadersProvider)(ABI49_0_0RCTModuleRegistry *);
  NSArray<id<ABI49_0_0RCTImageDataDecoder>> * (^_decodersProvider)(ABI49_0_0RCTModuleRegistry *);
  NSArray<id<ABI49_0_0RCTImageURLLoader>> *_loaders;
  NSArray<id<ABI49_0_0RCTImageDataDecoder>> *_decoders;
  NSOperationQueue *_imageDecodeQueue;
  dispatch_queue_t _URLRequestQueue;
  id<ABI49_0_0RCTImageCache> _imageCache;
  NSMutableArray *_pendingTasks;
  NSInteger _activeTasks;
  NSMutableArray *_pendingDecodes;
  NSInteger _scheduledDecodes;
  NSUInteger _activeBytes;
  std::mutex _loadersMutex;
  __weak id<ABI49_0_0RCTImageRedirectProtocol> _redirectDelegate;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;
@synthesize maxConcurrentLoadingTasks = _maxConcurrentLoadingTasks;
@synthesize maxConcurrentDecodingTasks = _maxConcurrentDecodingTasks;
@synthesize maxConcurrentDecodingBytes = _maxConcurrentDecodingBytes;

ABI49_0_0RCT_EXPORT_MODULE()

- (instancetype)init
{
  return [self initWithRedirectDelegate:nil];
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)initWithRedirectDelegate:(id<ABI49_0_0RCTImageRedirectProtocol>)redirectDelegate
{
  if (self = [super init]) {
    _redirectDelegate = redirectDelegate;
  }
  return self;
}

- (instancetype)initWithRedirectDelegate:(id<ABI49_0_0RCTImageRedirectProtocol>)redirectDelegate
                         loadersProvider:(NSArray<id<ABI49_0_0RCTImageURLLoader>> * (^)(ABI49_0_0RCTModuleRegistry *))getLoaders
                        decodersProvider:(NSArray<id<ABI49_0_0RCTImageDataDecoder>> * (^)(ABI49_0_0RCTModuleRegistry *))getHandlers
{
  if (self = [self initWithRedirectDelegate:redirectDelegate]) {
    _loadersProvider = getLoaders;
    _decodersProvider = getHandlers;
  }
  return self;
}

- (void)setUp
{
  // Set defaults
  _maxConcurrentLoadingTasks = _maxConcurrentLoadingTasks ?: 4;
  _maxConcurrentDecodingTasks = _maxConcurrentDecodingTasks ?: 2;
  _maxConcurrentDecodingBytes = _maxConcurrentDecodingBytes ?: 30 * 1024 * 1024; // 30MB

  _URLRequestQueue = dispatch_queue_create("com.facebook.ABI49_0_0React.ImageLoaderURLRequestQueue", DISPATCH_QUEUE_SERIAL);
}

- (float)handlerPriority
{
  return 2;
}
#pragma mark - ABI49_0_0RCTImageLoaderProtocol 1/3

- (id<ABI49_0_0RCTImageCache>)imageCache
{
  if (!_imageCache) {
    // set up with default cache
    _imageCache = [ABI49_0_0RCTImageCache new];
  }
  return _imageCache;
}

- (void)setImageCache:(id<ABI49_0_0RCTImageCache>)cache
{
  if (_imageCache) {
    ABI49_0_0RCTLogWarn(@"ABI49_0_0RCTImageCache was already set and has now been overridden.");
  }
  _imageCache = cache;
}

- (id<ABI49_0_0RCTImageURLLoader>)imageURLLoaderForURL:(NSURL *)URL
{
  if (!_maxConcurrentLoadingTasks) {
    [self setUp];
  }

  if (!_loaders) {
    std::unique_lock<std::mutex> guard(_loadersMutex);
    if (!_loaders) {
      // Get loaders, sorted in reverse priority order (highest priority first)
      if (_loadersProvider) {
        _loaders = _loadersProvider(self.moduleRegistry);
      } else {
        ABI49_0_0RCTAssert(_bridge, @"Trying to find ABI49_0_0RCTImageURLLoaders and bridge not set.");
        _loaders = [_bridge modulesConformingToProtocol:@protocol(ABI49_0_0RCTImageURLLoader)];
      }

      _loaders =
          [_loaders sortedArrayUsingComparator:^NSComparisonResult(id<ABI49_0_0RCTImageURLLoader> a, id<ABI49_0_0RCTImageURLLoader> b) {
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
  }

  if (ABI49_0_0RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<ABI49_0_0RCTImageURLLoader> previousLoader = nil;
    for (id<ABI49_0_0RCTImageURLLoader> loader in _loaders) {
      float priority = [loader respondsToSelector:@selector(loaderPriority)] ? [loader loaderPriority] : 0;
      if (previousLoader && priority < previousPriority) {
        return previousLoader;
      }
      if ([loader canLoadImageURL:URL]) {
        if (previousLoader) {
          if (priority == previousPriority) {
            ABI49_0_0RCTLogError(
                @"The ABI49_0_0RCTImageURLLoaders %@ and %@ both reported that"
                 " they can load the URL %@, and have equal priority"
                 " (%g). This could result in non-deterministic behavior.",
                loader,
                previousLoader,
                URL,
                priority);
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
  for (id<ABI49_0_0RCTImageURLLoader> loader in _loaders) {
    if ([loader canLoadImageURL:URL]) {
      return loader;
    }
  }
  return nil;
}

#pragma mark - Private Image Decoding & Resizing

- (id<ABI49_0_0RCTImageDataDecoder>)imageDataDecoderForData:(NSData *)data
{
  if (!_maxConcurrentLoadingTasks) {
    [self setUp];
  }

  if (!_decoders) {
    // Get decoders, sorted in reverse priority order (highest priority first)

    if (_decodersProvider) {
      _decoders = _decodersProvider(self.moduleRegistry);
    } else {
      ABI49_0_0RCTAssert(_bridge, @"Trying to find ABI49_0_0RCTImageDataDecoders and bridge not set.");
      _decoders = [_bridge modulesConformingToProtocol:@protocol(ABI49_0_0RCTImageDataDecoder)];
    }

    _decoders = [_decoders
        sortedArrayUsingComparator:^NSComparisonResult(id<ABI49_0_0RCTImageDataDecoder> a, id<ABI49_0_0RCTImageDataDecoder> b) {
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

  if (ABI49_0_0RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<ABI49_0_0RCTImageDataDecoder> previousDecoder = nil;
    for (id<ABI49_0_0RCTImageDataDecoder> decoder in _decoders) {
      float priority = [decoder respondsToSelector:@selector(decoderPriority)] ? [decoder decoderPriority] : 0;
      if (previousDecoder && priority < previousPriority) {
        return previousDecoder;
      }
      if ([decoder canDecodeImageData:data]) {
        if (previousDecoder) {
          if (priority == previousPriority) {
            ABI49_0_0RCTLogError(
                @"The ABI49_0_0RCTImageDataDecoders %@ and %@ both reported that"
                 " they can decode the data <NSData %p; %tu bytes>, and"
                 " have equal priority (%g). This could result in"
                 " non-deterministic behavior.",
                decoder,
                previousDecoder,
                data,
                data.length,
                priority);
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
  for (id<ABI49_0_0RCTImageDataDecoder> decoder in _decoders) {
    if ([decoder canDecodeImageData:data]) {
      return decoder;
    }
  }
  return nil;
}

static UIImage *ABI49_0_0RCTResizeImageIfNeeded(UIImage *image, CGSize size, CGFloat scale, ABI49_0_0RCTResizeMode resizeMode)
{
  if (CGSizeEqualToSize(size, CGSizeZero) || CGSizeEqualToSize(image.size, CGSizeZero) ||
      CGSizeEqualToSize(image.size, size)) {
    return image;
  }
  CGRect targetSize = ABI49_0_0RCTTargetRect(image.size, size, scale, resizeMode);
  CGAffineTransform transform = ABI49_0_0RCTTransformFromTargetRect(image.size, targetSize);
  image = ABI49_0_0RCTTransformImage(image, size, scale, transform);
  return image;
}

#pragma mark - ABI49_0_0RCTImageLoaderProtocol 2/3

- (nullable ABI49_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                           callback:(ABI49_0_0RCTImageLoaderCompletionBlock)callback
{
  return [self loadImageWithURLRequest:imageURLRequest priority:ABI49_0_0RCTImageLoaderPriorityImmediate callback:callback];
}

- (nullable ABI49_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                           priority:(ABI49_0_0RCTImageLoaderPriority)priority
                                                           callback:(ABI49_0_0RCTImageLoaderCompletionBlock)callback
{
  return [self loadImageWithURLRequest:imageURLRequest
                                  size:CGSizeZero
                                 scale:1
                               clipped:YES
                            resizeMode:ABI49_0_0RCTResizeModeStretch
                              priority:priority
                         progressBlock:nil
                      partialLoadBlock:nil
                       completionBlock:callback];
}

- (nullable ABI49_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                               size:(CGSize)size
                                                              scale:(CGFloat)scale
                                                            clipped:(BOOL)clipped
                                                         resizeMode:(ABI49_0_0RCTResizeMode)resizeMode
                                                      progressBlock:(ABI49_0_0RCTImageLoaderProgressBlock)progressBlock
                                                   partialLoadBlock:(ABI49_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                                    completionBlock:(ABI49_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  return [self loadImageWithURLRequest:imageURLRequest
                                  size:size
                                 scale:scale
                               clipped:clipped
                            resizeMode:resizeMode
                              priority:ABI49_0_0RCTImageLoaderPriorityImmediate
                         progressBlock:progressBlock
                      partialLoadBlock:partialLoadBlock
                       completionBlock:completionBlock];
}

- (nullable ABI49_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                               size:(CGSize)size
                                                              scale:(CGFloat)scale
                                                            clipped:(BOOL)clipped
                                                         resizeMode:(ABI49_0_0RCTResizeMode)resizeMode
                                                           priority:(ABI49_0_0RCTImageLoaderPriority)priority
                                                      progressBlock:(ABI49_0_0RCTImageLoaderProgressBlock)progressBlock
                                                   partialLoadBlock:(ABI49_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                                    completionBlock:(ABI49_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  ABI49_0_0RCTImageURLLoaderRequest *request = [self loadImageWithURLRequest:imageURLRequest
      size:size
      scale:scale
      clipped:clipped
      resizeMode:resizeMode
      priority:priority
      attribution:{}
      progressBlock:progressBlock
      partialLoadBlock:partialLoadBlock
      completionBlock:^(NSError *error, UIImage *image, id metadata) {
        completionBlock(error, image);
      }];
  return ^{
    [request cancel];
  };
}

#pragma mark - Private Downloader Methods

- (void)dequeueTasks
{
  dispatch_async(_URLRequestQueue, ^{
    // Remove completed tasks
    NSMutableArray *tasksToRemove = nil;
    for (ABI49_0_0RCTNetworkTask *task in self->_pendingTasks.reverseObjectEnumerator) {
      switch (task.status) {
        case ABI49_0_0RCTNetworkTaskFinished:
          if (!tasksToRemove) {
            tasksToRemove = [NSMutableArray new];
          }
          [tasksToRemove addObject:task];
          self->_activeTasks--;
          break;
        case ABI49_0_0RCTNetworkTaskPending:
          break;
        case ABI49_0_0RCTNetworkTaskInProgress:
          // Check task isn't "stuck"
          if (task.requestToken == nil) {
            ABI49_0_0RCTLogWarn(@"Task orphaned for request %@", task.request);
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
    while (activeDecodes == 0 ||
           (self->_activeBytes <= self->_maxConcurrentDecodingBytes &&
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
    for (ABI49_0_0RCTNetworkTask *task in self->_pendingTasks) {
      if (MAX(self->_activeTasks, self->_scheduledDecodes) >= self->_maxConcurrentLoadingTasks) {
        break;
      }
      if (task.status == ABI49_0_0RCTNetworkTaskPending) {
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
- (ABI49_0_0RCTImageURLLoaderRequest *)_loadImageOrDataWithURLRequest:(NSURLRequest *)request
                                                        size:(CGSize)size
                                                       scale:(CGFloat)scale
                                                  resizeMode:(ABI49_0_0RCTResizeMode)resizeMode
                                                    priority:(ABI49_0_0RCTImageLoaderPriority)priority
                                                 attribution:(const ImageURLLoaderAttribution &)attribution
                                               progressBlock:(ABI49_0_0RCTImageLoaderProgressBlock)progressHandler
                                            partialLoadBlock:(ABI49_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                             completionBlock:(void (^)(
                                                                 NSError *error,
                                                                 id imageOrData,
                                                                 id imageMetadata,
                                                                 BOOL cacheResult,
                                                                 NSURLResponse *response))completionBlock
{
  {
    NSMutableURLRequest *mutableRequest = [request mutableCopy];
    [NSURLProtocol setProperty:@"ABI49_0_0RCTImageLoader" forKey:@"trackingName" inRequest:mutableRequest];

    // Add missing png extension
    if (request.URL.fileURL && request.URL.pathExtension.length == 0) {
      mutableRequest.URL = [request.URL URLByAppendingPathExtension:@"png"];
    }
    if (_redirectDelegate != nil) {
      mutableRequest.URL = [_redirectDelegate redirectAssetsURL:mutableRequest.URL];
    }
    request = mutableRequest;
  }

  // Create a copy here so the value is retained when accessed in the blocks below.
  ImageURLLoaderAttribution attributionCopy(attribution);

  // Find suitable image URL loader
  id<ABI49_0_0RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:request.URL];
  BOOL requiresScheduling =
      [loadHandler respondsToSelector:@selector(requiresScheduling)] ? [loadHandler requiresScheduling] : YES;

  BOOL cacheResult =
      [loadHandler respondsToSelector:@selector(shouldCacheLoadedImages)] ? [loadHandler shouldCacheLoadedImages] : YES;

  if (request.cachePolicy == NSURLRequestReloadIgnoringLocalCacheData) {
    cacheResult = NO;
  }

  if (cacheResult && partialLoadHandler) {
    UIImage *image = [[self imageCache] imageForUrl:request.URL.absoluteString
                                               size:size
                                              scale:scale
                                         resizeMode:resizeMode];
    if (image) {
      partialLoadHandler(image);
    }
  }

  auto cancelled = std::make_shared<std::atomic<int>>(0);
  __block dispatch_block_t cancelLoad = nil;
  __block NSLock *cancelLoadLock = [NSLock new];
  NSString *requestId =
      [NSString stringWithFormat:@"%@-%llu", [[NSUUID UUID] UUIDString], monotonicTimeGetCurrentNanoseconds()];

  void (^completionHandler)(NSError *, id, id, NSURLResponse *) =
      ^(NSError *error, id imageOrData, id imageMetadata, NSURLResponse *response) {
        [cancelLoadLock lock];
        cancelLoad = nil;
        [cancelLoadLock unlock];

        // If we've received an image, we should try to set it synchronously,
        // if it's data, do decoding on a background thread.
        if (ABI49_0_0RCTIsMainQueue() && ![imageOrData isKindOfClass:[UIImage class]]) {
          // Most loaders do not return on the main thread, so caller is probably not
          // expecting it, and may do expensive post-processing in the callback
          dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            if (!std::atomic_load(cancelled.get())) {
              completionBlock(error, imageOrData, imageMetadata, cacheResult, response);
            }
          });
        } else if (!std::atomic_load(cancelled.get())) {
          if (response && error && [response isKindOfClass:[NSHTTPURLResponse class]]) {
            NSHTTPURLResponse *_httpResp = (NSHTTPURLResponse *)response;
            error = addResponseHeadersToError(error, _httpResp);
          }
          completionBlock(error, imageOrData, imageMetadata, cacheResult, response);
        }
      };

  // If the loader doesn't require scheduling we call it directly on
  // the main queue.
  if (loadHandler && !requiresScheduling) {
    if ([loadHandler conformsToProtocol:@protocol(ABI49_0_0RCTImageURLLoaderWithAttribution)]) {
      return [(id<ABI49_0_0RCTImageURLLoaderWithAttribution>)loadHandler
             loadImageForURL:request.URL
                        size:size
                       scale:scale
                  resizeMode:resizeMode
                   requestId:requestId
                    priority:priority
                 attribution:attributionCopy
             progressHandler:progressHandler
          partialLoadHandler:partialLoadHandler
           completionHandler:^(NSError *error, UIImage *image, id metadata) {
             completionHandler(error, image, metadata, nil);
           }];
    }
    ABI49_0_0RCTImageLoaderCancellationBlock cb = [loadHandler loadImageForURL:request.URL
                                                                 size:size
                                                                scale:scale
                                                           resizeMode:resizeMode
                                                      progressHandler:progressHandler
                                                   partialLoadHandler:partialLoadHandler
                                                    completionHandler:^(NSError *error, UIImage *image) {
                                                      completionHandler(error, image, nil, nil);
                                                    }];
    return [[ABI49_0_0RCTImageURLLoaderRequest alloc] initWithRequestId:nil imageURL:request.URL cancellationBlock:cb];
  }

  // All access to URL cache must be serialized
  if (!_URLRequestQueue) {
    [self setUp];
  }

  __weak ABI49_0_0RCTImageLoader *weakSelf = self;
  dispatch_async(_URLRequestQueue, ^{
    __typeof(self) strongSelf = weakSelf;
    if (atomic_load(cancelled.get()) || !strongSelf) {
      return;
    }

    if (loadHandler) {
      dispatch_block_t cancelLoadLocal;
      if ([loadHandler conformsToProtocol:@protocol(ABI49_0_0RCTImageURLLoaderWithAttribution)]) {
        ABI49_0_0RCTImageURLLoaderRequest *loaderRequest = [(id<ABI49_0_0RCTImageURLLoaderWithAttribution>)loadHandler
               loadImageForURL:request.URL
                          size:size
                         scale:scale
                    resizeMode:resizeMode
                     requestId:requestId
                      priority:priority
                   attribution:attributionCopy
               progressHandler:progressHandler
            partialLoadHandler:partialLoadHandler
             completionHandler:^(NSError *error, UIImage *image, id metadata) {
               completionHandler(error, image, metadata, nil);
             }];
        cancelLoadLocal = loaderRequest.cancellationBlock;
      } else {
        cancelLoadLocal = [loadHandler loadImageForURL:request.URL
                                                  size:size
                                                 scale:scale
                                            resizeMode:resizeMode
                                       progressHandler:progressHandler
                                    partialLoadHandler:partialLoadHandler
                                     completionHandler:^(NSError *error, UIImage *image) {
                                       completionHandler(error, image, nil, nil);
                                     }];
      }
      [cancelLoadLock lock];
      cancelLoad = cancelLoadLocal;
      [cancelLoadLock unlock];
    } else {
      UIImage *image;
      if (cacheResult) {
        image = [[strongSelf imageCache] imageForUrl:request.URL.absoluteString
                                                size:size
                                               scale:scale
                                          resizeMode:resizeMode];
      }

      if (image) {
        completionHandler(nil, image, nil, nil);
      } else {
        // Use networking module to load image
        dispatch_block_t cancelLoadLocal =
            [strongSelf _loadURLRequest:request
                          progressBlock:progressHandler
                        completionBlock:^(NSError *error, id imageOrData, NSURLResponse *response) {
                          completionHandler(error, imageOrData, nil, response);
                        }];
        [cancelLoadLock lock];
        cancelLoad = cancelLoadLocal;
        [cancelLoadLock unlock];
      }
    }
  });

  return [[ABI49_0_0RCTImageURLLoaderRequest alloc] initWithRequestId:requestId
                                                    imageURL:request.URL
                                           cancellationBlock:^{
                                             BOOL alreadyCancelled = atomic_fetch_or(cancelled.get(), 1) ? YES : NO;
                                             if (alreadyCancelled) {
                                               return;
                                             }
                                             [cancelLoadLock lock];
                                             dispatch_block_t cancelLoadLocal = cancelLoad;
                                             cancelLoad = nil;
                                             [cancelLoadLock unlock];
                                             if (cancelLoadLocal) {
                                               cancelLoadLocal();
                                             }
                                           }];
}

- (ABI49_0_0RCTImageLoaderCancellationBlock)_loadURLRequest:(NSURLRequest *)request
                                     progressBlock:(ABI49_0_0RCTImageLoaderProgressBlock)progressHandler
                                   completionBlock:(void (^)(NSError *error, id imageOrData, NSURLResponse *response))
                                                       completionHandler
{
  ABI49_0_0RCTNetworking *networking = [_moduleRegistry moduleForName:"Networking"];
  if (ABI49_0_0RCT_DEBUG && !networking) {
    ABI49_0_0RCTLogError(
        @"No suitable image URL loader found for %@. You may need to "
         " import the ABI49_0_0RCTNetwork library in order to load images.",
        request.URL.absoluteString);
    return NULL;
  }

  // Check if networking module can load image
  if (ABI49_0_0RCT_DEBUG && ![networking canHandleRequest:request]) {
    ABI49_0_0RCTLogError(@"No suitable image URL loader found for %@", request.URL.absoluteString);
    return NULL;
  }

  // Use networking module to load image
  ABI49_0_0RCTURLRequestCompletionBlock processResponse = ^(NSURLResponse *response, NSData *data, NSError *error) {
    // Check for system errors
    if (error) {
      completionHandler(error, nil, response);
      return;
    } else if (!response) {
      completionHandler(ABI49_0_0RCTErrorWithMessage(@"Response metadata error"), nil, response);
      return;
    } else if (!data) {
      completionHandler(ABI49_0_0RCTErrorWithMessage(@"Unknown image download error"), nil, response);
      return;
    }

    // Check for http errors
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSInteger statusCode = ((NSHTTPURLResponse *)response).statusCode;
      if (statusCode != 200) {
        NSString *errorMessage = [NSString stringWithFormat:@"Failed to load %@", response.URL];
        NSDictionary *userInfo = @{NSLocalizedDescriptionKey : errorMessage};
        completionHandler(
            [[NSError alloc] initWithDomain:NSURLErrorDomain code:statusCode userInfo:userInfo], nil, response);
        return;
      }
    }

    // Call handler
    completionHandler(nil, data, response);
  };

  // Download image
  __weak __typeof(self) weakSelf = self;
  __block ABI49_0_0RCTNetworkTask *task =
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
                               someError = ABI49_0_0RCTErrorWithMessage(@"Response metadata error");
                             } else {
                               someError = ABI49_0_0RCTErrorWithMessage(@"Unknown image download error");
                             }
                             completionHandler(someError, nil, response);
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

#pragma mark - ABI49_0_0RCTImageLoaderWithAttributionProtocol

- (ABI49_0_0RCTImageURLLoaderRequest *)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                 size:(CGSize)size
                                                scale:(CGFloat)scale
                                              clipped:(BOOL)clipped
                                           resizeMode:(ABI49_0_0RCTResizeMode)resizeMode
                                             priority:(ABI49_0_0RCTImageLoaderPriority)priority
                                          attribution:(const ImageURLLoaderAttribution &)attribution
                                        progressBlock:(ABI49_0_0RCTImageLoaderProgressBlock)progressBlock
                                     partialLoadBlock:(ABI49_0_0RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                      completionBlock:(ABI49_0_0RCTImageLoaderCompletionBlockWithMetadata)completionBlock
{
  auto cancelled = std::make_shared<std::atomic<int>>(0);
  __block dispatch_block_t cancelLoad = nil;
  __block NSLock *cancelLoadLock = [NSLock new];
  dispatch_block_t cancellationBlock = ^{
    BOOL alreadyCancelled = atomic_fetch_or(cancelled.get(), 1) ? YES : NO;
    if (alreadyCancelled) {
      return;
    }
    [cancelLoadLock lock];
    dispatch_block_t cancelLoadLocal = cancelLoad;
    cancelLoad = nil;
    [cancelLoadLock unlock];
    if (cancelLoadLocal) {
      cancelLoadLocal();
    }
  };

  __weak ABI49_0_0RCTImageLoader *weakSelf = self;
  void (^completionHandler)(NSError *, id, id, BOOL, NSURLResponse *) =
      ^(NSError *error, id imageOrData, id imageMetadata, BOOL cacheResult, NSURLResponse *response) {
        __typeof(self) strongSelf = weakSelf;
        if (std::atomic_load(cancelled.get()) || !strongSelf) {
          return;
        }

        if (!imageOrData || [imageOrData isKindOfClass:[UIImage class]]) {
          [cancelLoadLock lock];
          cancelLoad = nil;
          [cancelLoadLock unlock];
          completionBlock(error, imageOrData, imageMetadata);
          return;
        }

        ABI49_0_0RCTImageLoaderCompletionBlock decodeCompletionHandler = ^(NSError *error_, UIImage *image) {
          if (cacheResult && image) {
            // Store decoded image in cache
            [[strongSelf imageCache] addImageToCache:image
                                                 URL:imageURLRequest.URL.absoluteString
                                                size:size
                                               scale:scale
                                          resizeMode:resizeMode
                                            response:response];
          }
          [cancelLoadLock lock];
          cancelLoad = nil;
          [cancelLoadLock unlock];
          completionBlock(error_, image, nil);
        };
        dispatch_block_t cancelLoadLocal = [strongSelf decodeImageData:imageOrData
                                                                  size:size
                                                                 scale:scale
                                                               clipped:clipped
                                                            resizeMode:resizeMode
                                                       completionBlock:decodeCompletionHandler];
        [cancelLoadLock lock];
        cancelLoad = cancelLoadLocal;
        [cancelLoadLock unlock];
      };

  ABI49_0_0RCTImageURLLoaderRequest *loaderRequest = [self _loadImageOrDataWithURLRequest:imageURLRequest
                                                                            size:size
                                                                           scale:scale
                                                                      resizeMode:resizeMode
                                                                        priority:priority
                                                                     attribution:attribution
                                                                   progressBlock:progressBlock
                                                                partialLoadBlock:partialLoadBlock
                                                                 completionBlock:completionHandler];
  cancelLoad = loaderRequest.cancellationBlock;
  return [[ABI49_0_0RCTImageURLLoaderRequest alloc] initWithRequestId:loaderRequest.requestId
                                                    imageURL:imageURLRequest.URL
                                           cancellationBlock:cancellationBlock];
}

- (BOOL)shouldEnablePerfLoggingForRequestUrl:(NSURL *)url
{
  id<ABI49_0_0RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:url];
  if ([loadHandler respondsToSelector:@selector(shouldEnablePerfLogging)]) {
    return [(id<ABI49_0_0RCTImageURLLoaderWithAttribution>)loadHandler shouldEnablePerfLogging];
  }
  return NO;
}

- (void)trackURLImageVisibilityForRequest:(ABI49_0_0RCTImageURLLoaderRequest *)loaderRequest imageView:(UIView *)imageView
{
  if (!loaderRequest || !imageView) {
    return;
  }

  id<ABI49_0_0RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:loaderRequest.imageURL];
  if ([loadHandler respondsToSelector:@selector(trackURLImageVisibilityForRequest:imageView:)]) {
    [(id<ABI49_0_0RCTImageURLLoaderWithAttribution>)loadHandler trackURLImageVisibilityForRequest:loaderRequest
                                                                               imageView:imageView];
  }
}

- (void)trackURLImageRequestDidDestroy:(ABI49_0_0RCTImageURLLoaderRequest *)loaderRequest
{
  if (!loaderRequest) {
    return;
  }

  id<ABI49_0_0RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:loaderRequest.imageURL];
  if ([loadHandler respondsToSelector:@selector(trackURLImageRequestDidDestroy:)]) {
    [(id<ABI49_0_0RCTImageURLLoaderWithAttribution>)loadHandler trackURLImageRequestDidDestroy:loaderRequest];
  }
}

- (void)trackURLImageDidDestroy:(ABI49_0_0RCTImageURLLoaderRequest *)loaderRequest
{
  if (!loaderRequest) {
    return;
  }

  id<ABI49_0_0RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:loaderRequest.imageURL];
  if ([loadHandler respondsToSelector:@selector(trackURLImageDidDestroy:)]) {
    [(id<ABI49_0_0RCTImageURLLoaderWithAttribution>)loadHandler trackURLImageDidDestroy:loaderRequest];
  }
}

#pragma mark - ABI49_0_0RCTImageLoaderProtocol 3/3

- (ABI49_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)data
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                           clipped:(BOOL)clipped
                                        resizeMode:(ABI49_0_0RCTResizeMode)resizeMode
                                   completionBlock:(ABI49_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  if (data.length == 0) {
    completionBlock(ABI49_0_0RCTErrorWithMessage(@"No image data"), nil);
    return ^{
    };
  }

  auto cancelled = std::make_shared<std::atomic<int>>(0);
  void (^completionHandler)(NSError *, UIImage *) = ^(NSError *error, UIImage *image) {
    if (ABI49_0_0RCTIsMainQueue()) {
      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!std::atomic_load(cancelled.get())) {
          completionBlock(error, clipped ? ABI49_0_0RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
        }
      });
    } else if (!std::atomic_load(cancelled.get())) {
      completionBlock(error, clipped ? ABI49_0_0RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
    }
  };

  id<ABI49_0_0RCTImageDataDecoder> imageDecoder = [self imageDataDecoderForData:data];
  if (imageDecoder) {
    return [imageDecoder decodeImageData:data
                                    size:size
                                   scale:scale
                              resizeMode:resizeMode
                       completionHandler:completionHandler]
        ?: ^{
          };
  } else {
    dispatch_block_t decodeBlock = ^{
      // Calculate the size, in bytes, that the decompressed image will require
      NSInteger decodedImageBytes = (NSInteger)((size.width * scale) * (size.height * scale) * 4);

      // Mark these bytes as in-use
      self->_activeBytes += decodedImageBytes;

      // Do actual decompression on a concurrent background queue
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!std::atomic_load(cancelled.get())) {
          // Decompress the image data (this may be CPU and memory intensive)
          UIImage *image = ABI49_0_0RCTDecodeImageWithData(data, size, scale, resizeMode);

#if ABI49_0_0RCT_DEV
          CGSize imagePixelSize = ABI49_0_0RCTSizeInPixels(image.size, image.scale);
          CGSize screenPixelSize = ABI49_0_0RCTSizeInPixels(ABI49_0_0RCTScreenSize(), ABI49_0_0RCTScreenScale());
          if (imagePixelSize.width * imagePixelSize.height > screenPixelSize.width * screenPixelSize.height) {
            ABI49_0_0RCTLogInfo(
                @"[PERF ASSETS] Loading image at size %@, which is larger "
                 "than the screen size %@",
                NSStringFromCGSize(imagePixelSize),
                NSStringFromCGSize(screenPixelSize));
          }
#endif

          if (image) {
            completionHandler(nil, image);
          } else {
            NSString *errorMessage =
                [NSString stringWithFormat:@"Error decoding image data <NSData %p; %tu bytes>", data, data.length];
            NSError *finalError = ABI49_0_0RCTErrorWithMessage(errorMessage);
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
      if (activeDecodes == 0 ||
          (self->_activeBytes <= self->_maxConcurrentDecodingBytes &&
           activeDecodes <= self->_maxConcurrentDecodingTasks)) {
        decodeBlock();
      } else {
        [self->_pendingDecodes addObject:decodeBlock];
      }
    });

    return ^{
      std::atomic_store(cancelled.get(), 1);
    };
  }
}

- (ABI49_0_0RCTImageLoaderCancellationBlock)getImageSizeForURLRequest:(NSURLRequest *)imageURLRequest
                                                       block:(void (^)(NSError *error, CGSize size))callback
{
  void (^completion)(NSError *, id, id, BOOL, NSURLResponse *) =
      ^(NSError *error, id imageOrData, id imageMetadata, BOOL cacheResult, NSURLResponse *response) {
        CGSize size;
        if ([imageOrData isKindOfClass:[NSData class]]) {
          NSDictionary *meta = ABI49_0_0RCTGetImageMetadata(imageOrData);

          NSInteger imageOrientation = [meta[(id)kCGImagePropertyOrientation] integerValue];
          switch (imageOrientation) {
            case kCGImagePropertyOrientationLeft:
            case kCGImagePropertyOrientationRight:
            case kCGImagePropertyOrientationLeftMirrored:
            case kCGImagePropertyOrientationRightMirrored:
              // swap width and height
              size = (CGSize){
                  [meta[(id)kCGImagePropertyPixelHeight] floatValue],
                  [meta[(id)kCGImagePropertyPixelWidth] floatValue],
              };
              break;
            case kCGImagePropertyOrientationUp:
            case kCGImagePropertyOrientationDown:
            case kCGImagePropertyOrientationUpMirrored:
            case kCGImagePropertyOrientationDownMirrored:
            default:
              size = (CGSize){
                  [meta[(id)kCGImagePropertyPixelWidth] floatValue],
                  [meta[(id)kCGImagePropertyPixelHeight] floatValue],
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

  ABI49_0_0RCTImageURLLoaderRequest *loaderRequest = [self _loadImageOrDataWithURLRequest:imageURLRequest
                                                                            size:CGSizeZero
                                                                           scale:1
                                                                      resizeMode:ABI49_0_0RCTResizeModeStretch
                                                                        priority:ABI49_0_0RCTImageLoaderPriorityImmediate
                                                                     attribution:{}
                                                                   progressBlock:NULL
                                                                partialLoadBlock:NULL
                                                                 completionBlock:completion];
  return loaderRequest.cancellationBlock;
}

- (NSDictionary *)getImageCacheStatus:(NSArray *)requests
{
  NSMutableDictionary *results = [NSMutableDictionary dictionary];
  for (id request in requests) {
    NSURLRequest *urlRequest = [ABI49_0_0RCTConvert NSURLRequest:request];
    if (urlRequest) {
      NSCachedURLResponse *cachedResponse = [NSURLCache.sharedURLCache cachedResponseForRequest:urlRequest];
      if (cachedResponse) {
        if (cachedResponse.storagePolicy == NSURLCacheStorageAllowedInMemoryOnly) {
          results[urlRequest.URL.absoluteString] = @"memory";
        } else if (NSURLCache.sharedURLCache.currentMemoryUsage == 0) {
          // We can't check whether the file is cached on disk or memory.
          // However, if currentMemoryUsage is disabled, it must be read from disk.
          results[urlRequest.URL.absoluteString] = @"disk";
        } else {
          results[urlRequest.URL.absoluteString] = @"disk/memory";
        }
      }
    }
  }
  return results;
}

#pragma mark - ABI49_0_0RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  NSURL *requestURL = request.URL;

  // If the data being loaded is a video, return NO
  // Even better may be to implement this on the ABI49_0_0RCTImageURLLoader that would try to load it,
  // but we'd have to run the logic both in ABI49_0_0RCTPhotoLibraryImageLoader and
  // ABI49_0_0RCTAssetsLibraryRequestHandler. Once we drop iOS7 though, we'd drop
  // ABI49_0_0RCTAssetsLibraryRequestHandler and can move it there.
  static NSRegularExpression *videoRegex;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSError *error = nil;
    videoRegex = [NSRegularExpression regularExpressionWithPattern:@"(?:&|^)ext=MOV(?:&|$)"
                                                           options:NSRegularExpressionCaseInsensitive
                                                             error:&error];
    if (error) {
      ABI49_0_0RCTLogError(@"%@", error);
    }
  });

  NSString *query = requestURL.query;
  if (query != nil && [videoRegex firstMatchInString:query options:0 range:NSMakeRange(0, query.length)]) {
    return NO;
  }

  for (id<ABI49_0_0RCTImageURLLoader> loader in _loaders) {
    // Don't use ABI49_0_0RCTImageURLLoader protocol for modules that already conform to
    // ABI49_0_0RCTURLRequestHandler as it's inefficient to decode an image and then
    // convert it back into data
    if (![loader conformsToProtocol:@protocol(ABI49_0_0RCTURLRequestHandler)] && [loader canLoadImageURL:requestURL]) {
      return YES;
    }
  }

  return NO;
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<ABI49_0_0RCTURLRequestDelegate>)delegate
{
  __block ABI49_0_0RCTImageLoaderCancellationBlock requestToken;
  requestToken = [self loadImageWithURLRequest:request
                                      callback:^(NSError *error, UIImage *image) {
                                        if (error) {
                                          [delegate URLRequest:requestToken didCompleteWithError:error];
                                          return;
                                        }

                                        NSString *mimeType = nil;
                                        NSData *imageData = nil;
                                        if (ABI49_0_0RCTImageHasAlpha(image.CGImage)) {
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
    ((ABI49_0_0RCTImageLoaderCancellationBlock)requestToken)();
  }
}

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativeImageLoaderIOSSpecJSI>(params);
}

ABI49_0_0RCT_EXPORT_METHOD(getSize
                  : (NSString *)uri resolve
                  : (ABI49_0_0RCTPromiseResolveBlock)resolve reject
                  : (ABI49_0_0RCTPromiseRejectBlock)reject)
{
  NSURLRequest *request = [ABI49_0_0RCTConvert NSURLRequest:uri];
  [self getImageSizeForURLRequest:request
                            block:^(NSError *error, CGSize size) {
                              if (error) {
                                reject(
                                    @"E_GET_SIZE_FAILURE",
                                    [NSString stringWithFormat:@"Failed to getSize of %@", uri],
                                    error);
                              } else {
                                resolve(@[ @(size.width), @(size.height) ]);
                              }
                            }];
}

ABI49_0_0RCT_EXPORT_METHOD(getSizeWithHeaders
                  : (NSString *)uri headers
                  : (NSDictionary *)headers resolve
                  : (ABI49_0_0RCTPromiseResolveBlock)resolve reject
                  : (ABI49_0_0RCTPromiseRejectBlock)reject)
{
  NSURL *URL = [ABI49_0_0RCTConvert NSURL:uri];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
    [request addValue:[ABI49_0_0RCTConvert NSString:value] forHTTPHeaderField:key];
  }];
  [self getImageSizeForURLRequest:request
                            block:^(NSError *error, CGSize size) {
                              if (error) {
                                reject(@"E_GET_SIZE_FAILURE", nil, error);
                                return;
                              }
                              resolve(@{@"width" : @(size.width), @"height" : @(size.height)});
                            }];
}

ABI49_0_0RCT_EXPORT_METHOD(prefetchImage
                  : (NSString *)uri resolve
                  : (ABI49_0_0RCTPromiseResolveBlock)resolve reject
                  : (ABI49_0_0RCTPromiseRejectBlock)reject)
{
  [self prefetchImageWithMetadata:uri queryRootName:nil rootTag:0 resolve:resolve reject:reject];
}

ABI49_0_0RCT_EXPORT_METHOD(prefetchImageWithMetadata
                  : (NSString *)uri queryRootName
                  : (NSString *)queryRootName rootTag
                  : (double)rootTag resolve
                  : (ABI49_0_0RCTPromiseResolveBlock)resolve reject
                  : (ABI49_0_0RCTPromiseRejectBlock)reject)
{
  NSURLRequest *request = [ABI49_0_0RCTConvert NSURLRequest:uri];
  [self loadImageWithURLRequest:request
                           size:CGSizeZero
                          scale:1
                        clipped:YES
                     resizeMode:ABI49_0_0RCTResizeModeStretch
                       priority:ABI49_0_0RCTImageLoaderPriorityPrefetch
                    attribution:{
                                    .queryRootName = queryRootName ? [queryRootName UTF8String] : "",
                                    .surfaceId = (int)rootTag,
                                }
                  progressBlock:nil
               partialLoadBlock:nil
                completionBlock:^(NSError *error, UIImage *image, id completionMetadata) {
                  if (error) {
                    reject(@"E_PREFETCH_FAILURE", nil, error);
                    return;
                  }
                  resolve(@YES);
                }];
}

ABI49_0_0RCT_EXPORT_METHOD(queryCache
                  : (NSArray *)uris resolve
                  : (ABI49_0_0RCTPromiseResolveBlock)resolve reject
                  : (ABI49_0_0RCTPromiseRejectBlock)reject)
{
  resolve([self getImageCacheStatus:uris]);
}
@end

/**
 * DEPRECATED!! DO NOT USE
 * Instead use `[_bridge moduleForClass:[ABI49_0_0RCTImageLoader class]]`
 */
@implementation ABI49_0_0RCTBridge (ABI49_0_0RCTImageLoader)

- (ABI49_0_0RCTImageLoader *)imageLoader
{
  ABI49_0_0RCTLogWarn(
      @"Calling bridge.imageLoader is deprecated and will not work in newer versions of ABI49_0_0RN. Please update to the "
       "moduleForClass API or turboModuleRegistry API.");
  return [self moduleForClass:[ABI49_0_0RCTImageLoader class]];
}

@end

Class ABI49_0_0RCTImageLoaderCls(void)
{
  return ABI49_0_0RCTImageLoader.class;
}
