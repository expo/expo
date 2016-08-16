/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTImageLoader.h"

#import <ImageIO/ImageIO.h>

#import <libkern/OSAtomic.h>

#import <objc/runtime.h>

#import "ABI8_0_0RCTConvert.h"
#import "ABI8_0_0RCTDefines.h"
#import "ABI8_0_0RCTImageUtils.h"
#import "ABI8_0_0RCTLog.h"
#import "ABI8_0_0RCTNetworking.h"
#import "ABI8_0_0RCTUtils.h"

static const NSUInteger ABI8_0_0RCTMaxCachableDecodedImageSizeInBytes = 1048576; // 1MB

static NSString *ABI8_0_0RCTCacheKeyForImage(NSString *imageTag, CGSize size,
                                     CGFloat scale, ABI8_0_0RCTResizeMode resizeMode)
{
  return [NSString stringWithFormat:@"%@|%g|%g|%g|%zd",
          imageTag, size.width, size.height, scale, resizeMode];
}

@implementation UIImage (ReactABI8_0_0)

- (CAKeyframeAnimation *)ReactABI8_0_0KeyframeAnimation
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI8_0_0KeyframeAnimation:(CAKeyframeAnimation *)ReactABI8_0_0KeyframeAnimation
{
  objc_setAssociatedObject(self, @selector(ReactABI8_0_0KeyframeAnimation), ReactABI8_0_0KeyframeAnimation, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@implementation ABI8_0_0RCTImageLoader
{
  NSArray<id<ABI8_0_0RCTImageURLLoader>> *_loaders;
  NSArray<id<ABI8_0_0RCTImageDataDecoder>> *_decoders;
  NSOperationQueue *_imageDecodeQueue;
  dispatch_queue_t _URLCacheQueue;
  NSURLCache *_URLCache;
  NSCache *_decodedImageCache;
  NSMutableArray *_pendingTasks;
  NSInteger _activeTasks;
  NSMutableArray *_pendingDecodes;
  NSInteger _scheduledDecodes;
  NSUInteger _activeBytes;
}

@synthesize bridge = _bridge;

ABI8_0_0RCT_EXPORT_MODULE()

- (void)setUp
{
  // Set defaults
  _maxConcurrentLoadingTasks = _maxConcurrentLoadingTasks ?: 4;
  _maxConcurrentDecodingTasks = _maxConcurrentDecodingTasks ?: 2;
  _maxConcurrentDecodingBytes = _maxConcurrentDecodingBytes ?: 30 * 1024 * 1024; // 30MB

  _URLCacheQueue = dispatch_queue_create("com.facebook.ReactABI8_0_0.ImageLoaderURLCacheQueue", DISPATCH_QUEUE_SERIAL);

  _decodedImageCache = [NSCache new];
  _decodedImageCache.totalCostLimit = 5 * 1024 * 1024; // 5MB

  // Clear cache in the event of a memory warning, or if app enters background
  [[NSNotificationCenter defaultCenter] addObserver:_decodedImageCache selector:@selector(removeAllObjects) name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:_decodedImageCache selector:@selector(removeAllObjects) name:UIApplicationWillResignActiveNotification object:nil];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:_decodedImageCache];
}

- (float)handlerPriority
{
  return 1;
}

- (id<ABI8_0_0RCTImageURLLoader>)imageURLLoaderForURL:(NSURL *)URL
{
  if (!_maxConcurrentLoadingTasks) {
    [self setUp];
  }

  if (!_loaders) {
    // Get loaders, sorted in reverse priority order (highest priority first)
    ABI8_0_0RCTAssert(_bridge, @"Bridge not set");
    _loaders = [[_bridge modulesConformingToProtocol:@protocol(ABI8_0_0RCTImageURLLoader)] sortedArrayUsingComparator:^NSComparisonResult(id<ABI8_0_0RCTImageURLLoader> a, id<ABI8_0_0RCTImageURLLoader> b) {
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

  if (ABI8_0_0RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<ABI8_0_0RCTImageURLLoader> previousLoader = nil;
    for (id<ABI8_0_0RCTImageURLLoader> loader in _loaders) {
      float priority = [loader respondsToSelector:@selector(loaderPriority)] ? [loader loaderPriority] : 0;
      if (previousLoader && priority < previousPriority) {
        return previousLoader;
      }
      if ([loader canLoadImageURL:URL]) {
        if (previousLoader) {
          if (priority == previousPriority) {
            ABI8_0_0RCTLogError(@"The ABI8_0_0RCTImageURLLoaders %@ and %@ both reported that"
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
  for (id<ABI8_0_0RCTImageURLLoader> loader in _loaders) {
    if ([loader canLoadImageURL:URL]) {
      return loader;
    }
  }
  return nil;
}

- (id<ABI8_0_0RCTImageDataDecoder>)imageDataDecoderForData:(NSData *)data
{
  if (!_maxConcurrentLoadingTasks) {
    [self setUp];
  }

  if (!_decoders) {
    // Get decoders, sorted in reverse priority order (highest priority first)
    ABI8_0_0RCTAssert(_bridge, @"Bridge not set");
    _decoders = [[_bridge modulesConformingToProtocol:@protocol(ABI8_0_0RCTImageDataDecoder)] sortedArrayUsingComparator:^NSComparisonResult(id<ABI8_0_0RCTImageDataDecoder> a, id<ABI8_0_0RCTImageDataDecoder> b) {
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

  if (ABI8_0_0RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<ABI8_0_0RCTImageDataDecoder> previousDecoder = nil;
    for (id<ABI8_0_0RCTImageDataDecoder> decoder in _decoders) {
      float priority = [decoder respondsToSelector:@selector(decoderPriority)] ? [decoder decoderPriority] : 0;
      if (previousDecoder && priority < previousPriority) {
        return previousDecoder;
      }
      if ([decoder canDecodeImageData:data]) {
        if (previousDecoder) {
          if (priority == previousPriority) {
            ABI8_0_0RCTLogError(@"The ABI8_0_0RCTImageDataDecoders %@ and %@ both reported that"
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
  for (id<ABI8_0_0RCTImageDataDecoder> decoder in _decoders) {
    if ([decoder canDecodeImageData:data]) {
      return decoder;
    }
  }
  return nil;
}

static UIImage *ABI8_0_0RCTResizeImageIfNeeded(UIImage *image,
                                       CGSize size,
                                       CGFloat scale,
                                       ABI8_0_0RCTResizeMode resizeMode)
{
  if (CGSizeEqualToSize(size, CGSizeZero) ||
      CGSizeEqualToSize(image.size, CGSizeZero) ||
      CGSizeEqualToSize(image.size, size)) {
    return image;
  }
  CAKeyframeAnimation *animation = image.ReactABI8_0_0KeyframeAnimation;
  CGRect targetSize = ABI8_0_0RCTTargetRect(image.size, size, scale, resizeMode);
  CGAffineTransform transform = ABI8_0_0RCTTransformFromTargetRect(image.size, targetSize);
  image = ABI8_0_0RCTTransformImage(image, size, scale, transform);
  image.ReactABI8_0_0KeyframeAnimation = animation;
  return image;
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                           callback:(ABI8_0_0RCTImageLoaderCompletionBlock)callback
{
  return [self loadImageWithURLRequest:imageURLRequest
                                  size:CGSizeZero
                                 scale:1
                               clipped:YES
                            resizeMode:ABI8_0_0RCTResizeModeStretch
                         progressBlock:nil
                       completionBlock:callback];
}

- (void)dequeueTasks
{
  dispatch_async(_URLCacheQueue, ^{

    // Remove completed tasks
    for (ABI8_0_0RCTNetworkTask *task in self->_pendingTasks.reverseObjectEnumerator) {
      switch (task.status) {
        case ABI8_0_0RCTNetworkTaskFinished:
          [self->_pendingTasks removeObject:task];
          self->_activeTasks--;
          break;
        case ABI8_0_0RCTNetworkTaskPending:
          break;
        case ABI8_0_0RCTNetworkTaskInProgress:
          // Check task isn't "stuck"
          if (task.requestToken == nil) {
            ABI8_0_0RCTLogWarn(@"Task orphaned for request %@", task.request);
            [self->_pendingTasks removeObject:task];
            self->_activeTasks--;
            [task cancel];
          }
          break;
      }
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
    for (ABI8_0_0RCTNetworkTask *task in self->_pendingTasks) {
      if (MAX(self->_activeTasks, self->_scheduledDecodes) >= self->_maxConcurrentLoadingTasks) {
        break;
      }
      if (task.status == ABI8_0_0RCTNetworkTaskPending) {
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
- (ABI8_0_0RCTImageLoaderCancellationBlock)loadImageOrDataWithURLRequest:(NSURLRequest *)imageURLRequest
                                                            size:(CGSize)size
                                                           scale:(CGFloat)scale
                                                      resizeMode:(ABI8_0_0RCTResizeMode)resizeMode
                                                   progressBlock:(ABI8_0_0RCTImageLoaderProgressBlock)progressHandler
                                                 completionBlock:(void (^)(NSError *error, id imageOrData))completionBlock
{
  __block volatile uint32_t cancelled = 0;
  __block dispatch_block_t cancelLoad = nil;
  __weak ABI8_0_0RCTImageLoader *weakSelf = self;

  void (^completionHandler)(NSError *error, id imageOrData) = ^(NSError *error, id imageOrData) {
    if (ABI8_0_0RCTIsMainQueue()) {
      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!cancelled) {
          completionBlock(error, imageOrData);
        }
      });
    } else if (!cancelled) {
      completionBlock(error, imageOrData);
    }
  };

  // All access to URL cache must be serialized
  if (!_URLCacheQueue) {
    [self setUp];
  }

  dispatch_async(_URLCacheQueue, ^{
    __typeof(self) strongSelf = weakSelf;
    if (cancelled || !strongSelf) {
      return;
    }

    // Use a local variable so we can reassign it in this block
    NSURLRequest *request = imageURLRequest;

    // Add missing png extension
    if (request.URL.fileURL && request.URL.pathExtension.length == 0) {
      NSMutableURLRequest *mutableRequest = [request mutableCopy];
      mutableRequest.URL = [NSURL fileURLWithPath:[request.URL.path stringByAppendingPathExtension:@"png"]];
      request = mutableRequest;
    }

    // Find suitable image URL loader
    id<ABI8_0_0RCTImageURLLoader> loadHandler = [strongSelf imageURLLoaderForURL:request.URL];
    if (loadHandler) {
      cancelLoad = [loadHandler loadImageForURL:request.URL
                                           size:size
                                          scale:scale
                                     resizeMode:resizeMode
                                progressHandler:progressHandler
                              completionHandler:completionHandler] ?: ^{};
    } else {
      // Use networking module to load image
      cancelLoad = [strongSelf _loadURLRequest:request
                                 progressBlock:progressHandler
                               completionBlock:completionHandler];
    }
  });

  return ^{
    if (cancelLoad) {
      cancelLoad();
    }
    OSAtomicOr32Barrier(1, &cancelled);
  };
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)_loadURLRequest:(NSURLRequest *)request
                                     progressBlock:(ABI8_0_0RCTImageLoaderProgressBlock)progressHandler
                                   completionBlock:(void (^)(NSError *error, id imageOrData))completionHandler
{
  // Check if networking module is available
  if (ABI8_0_0RCT_DEBUG && ![_bridge respondsToSelector:@selector(networking)]) {
    ABI8_0_0RCTLogError(@"No suitable image URL loader found for %@. You may need to "
                " import the ABI8_0_0RCTNetwork library in order to load images.",
                request.URL.absoluteString);
    return NULL;
  }

  ABI8_0_0RCTNetworking *networking = [_bridge networking];

  // Check if networking module can load image
  if (ABI8_0_0RCT_DEBUG && ![networking canHandleRequest:request]) {
    ABI8_0_0RCTLogError(@"No suitable image URL loader found for %@", request.URL.absoluteString);
    return NULL;
  }

  // Use networking module to load image
  ABI8_0_0RCTURLRequestCompletionBlock processResponse = ^(NSURLResponse *response, NSData *data, NSError *error) {
    // Check for system errors
    if (error) {
      completionHandler(error, nil);
      return;
    } else if (!response) {
      completionHandler(ABI8_0_0RCTErrorWithMessage(@"Response metadata error"), nil);
      return;
    } else if (!data) {
      completionHandler(ABI8_0_0RCTErrorWithMessage(@"Unknown image download error"), nil);
      return;
    }

    // Check for http errors
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSInteger statusCode = ((NSHTTPURLResponse *)response).statusCode;
      if (statusCode != 200) {
        completionHandler([[NSError alloc] initWithDomain:NSURLErrorDomain
                                                     code:statusCode
                                                 userInfo:nil], nil);
        return;
      }
    }

    // Call handler
    completionHandler(nil, data);
  };

  // Check for cached response before reloading
  // TODO: move URL cache out of ABI8_0_0RCTImageLoader into its own module
  if (!_URLCache) {
    _URLCache = [[NSURLCache alloc] initWithMemoryCapacity:5 * 1024 * 1024 // 5MB
                                              diskCapacity:200 * 1024 * 1024 // 200MB
                                                  diskPath:@"ReactABI8_0_0/ABI8_0_0RCTImageDownloader"];
  }

  NSCachedURLResponse *cachedResponse = [_URLCache cachedResponseForRequest:request];
  while (cachedResponse) {
    if ([cachedResponse.response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)cachedResponse.response;
      if (httpResponse.statusCode == 301 || httpResponse.statusCode == 302) {
        NSString *location = httpResponse.allHeaderFields[@"Location"];
        if (location == nil) {
          completionHandler(ABI8_0_0RCTErrorWithMessage(@"Image redirect without location"), nil);
          return NULL;
        }

        NSURL *redirectURL = [NSURL URLWithString: location relativeToURL: request.URL];
        request = [NSURLRequest requestWithURL:redirectURL];
        cachedResponse = [_URLCache cachedResponseForRequest:request];
        continue;
      }
    }

    processResponse(cachedResponse.response, cachedResponse.data, nil);
    return NULL;
  }

  // Download image
  __weak __typeof(self) weakSelf = self;
  ABI8_0_0RCTNetworkTask *task = [networking networkTaskWithRequest:request completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
    if (error || !response || !data) {
      NSError *someError = nil;
      if (error) {
        someError = error;
      } else if (!response) {
        someError = ABI8_0_0RCTErrorWithMessage(@"Response metadata error");
      } else {
        someError = ABI8_0_0RCTErrorWithMessage(@"Unknown image download error");
      }
      completionHandler(someError, nil);
      [weakSelf dequeueTasks];
      return;
    }

    dispatch_async(self->_URLCacheQueue, ^{
      __typeof(self) strongSelf = self;
      if (!strongSelf) {
        return;
      }

      // Cache the response
      // TODO: move URL cache out of ABI8_0_0RCTImageLoader into its own module
      BOOL isHTTPRequest = [request.URL.scheme hasPrefix:@"http"];
      [strongSelf->_URLCache storeCachedResponse:
       [[NSCachedURLResponse alloc] initWithResponse:response
                                                data:data
                                            userInfo:nil
                                       storagePolicy:isHTTPRequest ? NSURLCacheStorageAllowed: NSURLCacheStorageAllowedInMemoryOnly]
                                      forRequest:request];
      // Process image data
      processResponse(response, data, nil);

      // Prepare for next task
      [strongSelf dequeueTasks];
    });

  }];

  task.downloadProgressBlock = progressHandler;

  if (task) {
    if (!_pendingTasks) {
      _pendingTasks = [NSMutableArray new];
    }
    [_pendingTasks addObject:task];
    [self dequeueTasks];
  }

  return ^{
    [task cancel];
    [weakSelf dequeueTasks];
  };
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                      size:(CGSize)size
                                                     scale:(CGFloat)scale
                                                   clipped:(BOOL)clipped
                                                resizeMode:(ABI8_0_0RCTResizeMode)resizeMode
                                             progressBlock:(ABI8_0_0RCTImageLoaderProgressBlock)progressHandler
                                           completionBlock:(ABI8_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  __block volatile uint32_t cancelled = 0;
  __block void(^cancelLoad)(void) = nil;
  __weak ABI8_0_0RCTImageLoader *weakSelf = self;

  // Check decoded image cache
  NSString *cacheKey = ABI8_0_0RCTCacheKeyForImage(imageURLRequest.URL.absoluteString, size, scale, resizeMode);
  {
    UIImage *image = [_decodedImageCache objectForKey:cacheKey];
    if (image) {
      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        completionBlock(nil, image);
      });
      return ^{};
    }
  }

  ABI8_0_0RCTImageLoaderCompletionBlock cacheResultHandler = ^(NSError *error, UIImage *image) {
    if (image) {
      CGFloat bytes = image.size.width * image.size.height * image.scale * image.scale * 4;
      if (bytes <= ABI8_0_0RCTMaxCachableDecodedImageSizeInBytes) {
        [self->_decodedImageCache setObject:image forKey:cacheKey cost:bytes];
      }
    }
    completionBlock(error, image);
  };

  void (^completionHandler)(NSError *, id) = ^(NSError *error, id imageOrData) {
    if (!cancelled) {
      if (!imageOrData || [imageOrData isKindOfClass:[UIImage class]]) {
        cacheResultHandler(error, imageOrData);
      } else {
        cancelLoad = [weakSelf decodeImageData:imageOrData
                                          size:size
                                         scale:scale
                                       clipped:clipped
                                    resizeMode:resizeMode
                               completionBlock:cacheResultHandler];
      }
    }
  };

  cancelLoad = [self loadImageOrDataWithURLRequest:imageURLRequest
                                              size:size
                                             scale:scale
                                        resizeMode:resizeMode
                                     progressBlock:progressHandler
                                   completionBlock:completionHandler];
  return ^{
    if (cancelLoad) {
      cancelLoad();
    }
    OSAtomicOr32Barrier(1, &cancelled);
  };
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)data
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                           clipped:(BOOL)clipped
                                        resizeMode:(ABI8_0_0RCTResizeMode)resizeMode
                                   completionBlock:(ABI8_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  if (data.length == 0) {
    completionBlock(ABI8_0_0RCTErrorWithMessage(@"No image data"), nil);
    return ^{};
  }

  __block volatile uint32_t cancelled = 0;
  void (^completionHandler)(NSError *, UIImage *) = ^(NSError *error, UIImage *image) {
    if (ABI8_0_0RCTIsMainQueue()) {
      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!cancelled) {
          completionBlock(error, clipped ? ABI8_0_0RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
        }
      });
    } else if (!cancelled) {
      completionBlock(error, clipped ? ABI8_0_0RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
    }
  };

  id<ABI8_0_0RCTImageDataDecoder> imageDecoder = [self imageDataDecoderForData:data];
  if (imageDecoder) {
    return [imageDecoder decodeImageData:data
                                    size:size
                                   scale:scale
                              resizeMode:resizeMode
                       completionHandler:completionHandler] ?: ^{};
  } else {

    if (!_URLCacheQueue) {
      [self setUp];
    }
    dispatch_async(_URLCacheQueue, ^{
      dispatch_block_t decodeBlock = ^{

        // Calculate the size, in bytes, that the decompressed image will require
        NSInteger decodedImageBytes = (size.width * scale) * (size.height * scale) * 4;

        // Mark these bytes as in-use
        self->_activeBytes += decodedImageBytes;

        // Do actual decompression on a concurrent background queue
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          if (!cancelled) {

            // Decompress the image data (this may be CPU and memory intensive)
            UIImage *image = ABI8_0_0RCTDecodeImageWithData(data, size, scale, resizeMode);

#if ABI8_0_0RCT_DEV

            CGSize imagePixelSize = ABI8_0_0RCTSizeInPixels(image.size, image.scale);
            CGSize screenPixelSize = ABI8_0_0RCTSizeInPixels(ABI8_0_0RCTScreenSize(), ABI8_0_0RCTScreenScale());
            if (imagePixelSize.width * imagePixelSize.height >
                screenPixelSize.width * screenPixelSize.height) {
              ABI8_0_0RCTLogInfo(@"[PERF ASSETS] Loading image at size %@, which is larger "
                         "than the screen size %@", NSStringFromCGSize(imagePixelSize),
                         NSStringFromCGSize(screenPixelSize));
            }

#endif

            if (image) {
              completionHandler(nil, image);
            } else {
              NSString *errorMessage = [NSString stringWithFormat:@"Error decoding image data <NSData %p; %tu bytes>", data, data.length];
              NSError *finalError = ABI8_0_0RCTErrorWithMessage(errorMessage);
              completionHandler(finalError, nil);
            }
          }

          // We're no longer retaining the uncompressed data, so now we'll mark
          // the decoding as complete so that the loading task queue can resume.
          dispatch_async(self->_URLCacheQueue, ^{
            self->_scheduledDecodes--;
            self->_activeBytes -= decodedImageBytes;
            [self dequeueTasks];
          });
        });
      };

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
      OSAtomicOr32Barrier(1, &cancelled);
    };
  }
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)getImageSizeForURLRequest:(NSURLRequest *)imageURLRequest
                                          block:(void(^)(NSError *error, CGSize size))completionBlock
{
  return [self loadImageOrDataWithURLRequest:imageURLRequest
                                 size:CGSizeZero
                                scale:1
                           resizeMode:ABI8_0_0RCTResizeModeStretch
                        progressBlock:nil
                      completionBlock:^(NSError *error, id imageOrData) {
                        CGSize size;
                        if ([imageOrData isKindOfClass:[NSData class]]) {
                          NSDictionary *meta = ABI8_0_0RCTGetImageMetadata(imageOrData);
                          size = (CGSize){
                            [meta[(id)kCGImagePropertyPixelWidth] doubleValue],
                            [meta[(id)kCGImagePropertyPixelHeight] doubleValue],
                          };
                        } else {
                          UIImage *image = imageOrData;
                          size = (CGSize){
                            image.size.width * image.scale,
                            image.size.height * image.scale,
                          };
                        }
                        completionBlock(error, size);
                      }];
}

#pragma mark - ABI8_0_0RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  NSURL *requestURL = request.URL;
  for (id<ABI8_0_0RCTImageURLLoader> loader in _loaders) {
    // Don't use ABI8_0_0RCTImageURLLoader protocol for modules that already conform to
    // ABI8_0_0RCTURLRequestHandler as it's inefficient to decode an image and then
    // convert it back into data
    if (![loader conformsToProtocol:@protocol(ABI8_0_0RCTURLRequestHandler)] &&
        [loader canLoadImageURL:requestURL]) {
      return YES;
    }
  }
  return NO;
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<ABI8_0_0RCTURLRequestDelegate>)delegate
{
  __block ABI8_0_0RCTImageLoaderCancellationBlock requestToken;
  requestToken = [self loadImageWithURLRequest:request callback:^(NSError *error, UIImage *image) {
    if (error) {
      [delegate URLRequest:requestToken didCompleteWithError:error];
      return;
    }

    NSString *mimeType = nil;
    NSData *imageData = nil;
    if (ABI8_0_0RCTImageHasAlpha(image.CGImage)) {
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
    ((ABI8_0_0RCTImageLoaderCancellationBlock)requestToken)();
  }
}

@end

@implementation ABI8_0_0RCTImageLoader (Deprecated)

- (ABI8_0_0RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                           callback:(ABI8_0_0RCTImageLoaderCompletionBlock)callback
{
  ABI8_0_0RCTLogWarn(@"[ABI8_0_0RCTImageLoader loadImageWithTag:callback:] is deprecated. Instead use [ABI8_0_0RCTImageLoader loadImageWithURLRequest:callback:]");
  return [self loadImageWithURLRequest:[ABI8_0_0RCTConvert NSURLRequest:imageTag]
                              callback:callback];
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(ABI8_0_0RCTResizeMode)resizeMode
                                      progressBlock:(ABI8_0_0RCTImageLoaderProgressBlock)progressBlock
                                    completionBlock:(ABI8_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  ABI8_0_0RCTLogWarn(@"[ABI8_0_0RCTImageLoader loadImageWithTag:size:scale:resizeMode:progressBlock:completionBlock:] is deprecated. Instead use [ABI8_0_0RCTImageLoader loadImageWithURLRequest:size:scale:clipped:resizeMode:progressBlock:completionBlock:]");
  return [self loadImageWithURLRequest:[ABI8_0_0RCTConvert NSURLRequest:imageTag]
                                  size:size
                                 scale:scale
                               clipped:YES
                            resizeMode:resizeMode
                         progressBlock:progressBlock
                       completionBlock:completionBlock];
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)loadImageWithoutClipping:(NSString *)imageTag
                                                       size:(CGSize)size
                                                      scale:(CGFloat)scale
                                                 resizeMode:(ABI8_0_0RCTResizeMode)resizeMode
                                              progressBlock:(ABI8_0_0RCTImageLoaderProgressBlock)progressBlock
                                            completionBlock:(ABI8_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  ABI8_0_0RCTLogWarn(@"[ABI8_0_0RCTImageLoader loadImageWithoutClipping:size:scale:resizeMode:progressBlock:completionBlock:] is deprecated. Instead use [ABI8_0_0RCTImageLoader loadImageWithURLRequest:size:scale:clipped:resizeMode:progressBlock:completionBlock:]");
  return [self loadImageWithURLRequest:[ABI8_0_0RCTConvert NSURLRequest:imageTag]
                                  size:size
                                 scale:scale
                               clipped:NO
                            resizeMode:resizeMode
                         progressBlock:progressBlock
                       completionBlock:completionBlock];
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI8_0_0RCTResizeMode)resizeMode
                                   completionBlock:(ABI8_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  ABI8_0_0RCTLogWarn(@"[ABI8_0_0RCTImageLoader decodeImageData:size:scale:resizeMode:completionBlock:] is deprecated. Instead use [ABI8_0_0RCTImageLoader decodeImageData:size:scale:clipped:resizeMode:completionBlock:]");
  return [self decodeImageData:imageData
                          size:size
                         scale:scale
                       clipped:NO
                    resizeMode:resizeMode
               completionBlock:completionBlock];
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)decodeImageDataWithoutClipping:(NSData *)imageData
                                                             size:(CGSize)size
                                                            scale:(CGFloat)scale
                                                       resizeMode:(ABI8_0_0RCTResizeMode)resizeMode
                                                  completionBlock:(ABI8_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  ABI8_0_0RCTLogWarn(@"[ABI8_0_0RCTImageLoader decodeImageDataWithoutClipping:size:scale:resizeMode:completionBlock:] is deprecated. Instead use [ABI8_0_0RCTImageLoader decodeImageData:size:scale:clipped:resizeMode:completionBlock:]");
  return [self decodeImageData:imageData
                          size:size
                         scale:scale
                       clipped:NO
                    resizeMode:resizeMode
               completionBlock:completionBlock];
}

- (ABI8_0_0RCTImageLoaderCancellationBlock)getImageSize:(NSString *)imageTag
                                          block:(void(^)(NSError *error, CGSize size))completionBlock
{
  ABI8_0_0RCTLogWarn(@"[ABI8_0_0RCTImageLoader getImageSize:block:] is deprecated. Instead use [ABI8_0_0RCTImageLoader getImageSizeForURLRequest:block:]");
  return [self getImageSizeForURLRequest:[ABI8_0_0RCTConvert NSURLRequest:imageTag]
                                   block:completionBlock];
}

@end

@implementation ABI8_0_0RCTBridge (ABI8_0_0RCTImageLoader)

- (ABI8_0_0RCTImageLoader *)imageLoader
{
  return [self moduleForClass:[ABI8_0_0RCTImageLoader class]];
}

@end
