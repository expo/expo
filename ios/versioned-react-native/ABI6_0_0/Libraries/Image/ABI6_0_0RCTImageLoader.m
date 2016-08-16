/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTImageLoader.h"

#import <libkern/OSAtomic.h>
#import <UIKit/UIKit.h>
#import <ImageIO/ImageIO.h>

#import "ABI6_0_0RCTConvert.h"
#import "ABI6_0_0RCTDefines.h"
#import "ABI6_0_0RCTImageUtils.h"
#import "ABI6_0_0RCTLog.h"
#import "ABI6_0_0RCTNetworking.h"
#import "ABI6_0_0RCTUtils.h"

static NSString *const ABI6_0_0RCTErrorInvalidURI = @"E_INVALID_URI";
static NSString *const ABI6_0_0RCTErrorPrefetchFailure = @"E_PREFETCH_FAILURE";

@implementation UIImage (ReactABI6_0_0)

- (CAKeyframeAnimation *)ReactABI6_0_0KeyframeAnimation
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI6_0_0KeyframeAnimation:(CAKeyframeAnimation *)ReactABI6_0_0KeyframeAnimation
{
  objc_setAssociatedObject(self, @selector(ReactABI6_0_0KeyframeAnimation), ReactABI6_0_0KeyframeAnimation, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@implementation ABI6_0_0RCTImageLoader
{
  NSArray<id<ABI6_0_0RCTImageURLLoader>> *_loaders;
  NSArray<id<ABI6_0_0RCTImageDataDecoder>> *_decoders;
  NSOperationQueue *_imageDecodeQueue;
  dispatch_queue_t _URLCacheQueue;
  NSURLCache *_URLCache;
  NSMutableArray *_pendingTasks;
  NSInteger _activeTasks;
  NSMutableArray *_pendingDecodes;
  NSInteger _scheduledDecodes;
  NSUInteger _activeBytes;
}

@synthesize bridge = _bridge;

ABI6_0_0RCT_EXPORT_MODULE()

- (void)setUp
{
  // Set defaults
  _maxConcurrentLoadingTasks = _maxConcurrentLoadingTasks ?: 4;
  _maxConcurrentDecodingTasks = _maxConcurrentDecodingTasks ?: 2;
  _maxConcurrentDecodingBytes = _maxConcurrentDecodingBytes ?: 30 * 1024 *1024; // 30MB

  _URLCacheQueue = dispatch_queue_create("com.facebook.ReactABI6_0_0.ImageLoaderURLCacheQueue", DISPATCH_QUEUE_SERIAL);
}

- (id<ABI6_0_0RCTImageURLLoader>)imageURLLoaderForURL:(NSURL *)URL
{
  if (!_maxConcurrentLoadingTasks) {
    [self setUp];
  }

  if (!_loaders) {
    // Get loaders, sorted in reverse priority order (highest priority first)
    ABI6_0_0RCTAssert(_bridge, @"Bridge not set");
    _loaders = [[_bridge modulesConformingToProtocol:@protocol(ABI6_0_0RCTImageURLLoader)] sortedArrayUsingComparator:^NSComparisonResult(id<ABI6_0_0RCTImageURLLoader> a, id<ABI6_0_0RCTImageURLLoader> b) {
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

  if (ABI6_0_0RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<ABI6_0_0RCTImageURLLoader> previousLoader = nil;
    for (id<ABI6_0_0RCTImageURLLoader> loader in _loaders) {
      float priority = [loader respondsToSelector:@selector(loaderPriority)] ? [loader loaderPriority] : 0;
      if (previousLoader && priority < previousPriority) {
        return previousLoader;
      }
      if ([loader canLoadImageURL:URL]) {
        if (previousLoader) {
          if (priority == previousPriority) {
            ABI6_0_0RCTLogError(@"The ABI6_0_0RCTImageURLLoaders %@ and %@ both reported that"
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
  for (id<ABI6_0_0RCTImageURLLoader> loader in _loaders) {
    if ([loader canLoadImageURL:URL]) {
      return loader;
    }
  }
  return nil;
}

- (id<ABI6_0_0RCTImageDataDecoder>)imageDataDecoderForData:(NSData *)data
{
  if (!_maxConcurrentLoadingTasks) {
    [self setUp];
  }

  if (!_decoders) {
    // Get decoders, sorted in reverse priority order (highest priority first)
    ABI6_0_0RCTAssert(_bridge, @"Bridge not set");
    _decoders = [[_bridge modulesConformingToProtocol:@protocol(ABI6_0_0RCTImageDataDecoder)] sortedArrayUsingComparator:^NSComparisonResult(id<ABI6_0_0RCTImageDataDecoder> a, id<ABI6_0_0RCTImageDataDecoder> b) {
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

  if (ABI6_0_0RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<ABI6_0_0RCTImageDataDecoder> previousDecoder = nil;
    for (id<ABI6_0_0RCTImageDataDecoder> decoder in _decoders) {
      float priority = [decoder respondsToSelector:@selector(decoderPriority)] ? [decoder decoderPriority] : 0;
      if (previousDecoder && priority < previousPriority) {
        return previousDecoder;
      }
      if ([decoder canDecodeImageData:data]) {
        if (previousDecoder) {
          if (priority == previousPriority) {
            ABI6_0_0RCTLogError(@"The ABI6_0_0RCTImageDataDecoders %@ and %@ both reported that"
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
  for (id<ABI6_0_0RCTImageDataDecoder> decoder in _decoders) {
    if ([decoder canDecodeImageData:data]) {
      return decoder;
    }
  }
  return nil;
}

static UIImage *ABI6_0_0RCTResizeImageIfNeeded(UIImage *image,
                                       CGSize size,
                                       CGFloat scale,
                                       ABI6_0_0RCTResizeMode resizeMode)
{
  if (CGSizeEqualToSize(size, CGSizeZero) ||
      CGSizeEqualToSize(image.size, CGSizeZero) ||
      CGSizeEqualToSize(image.size, size)) {
    return image;
  }
  CAKeyframeAnimation *animation = image.ReactABI6_0_0KeyframeAnimation;
  CGRect targetSize = ABI6_0_0RCTTargetRect(image.size, size, scale, resizeMode);
  CGAffineTransform transform = ABI6_0_0RCTTransformFromTargetRect(image.size, targetSize);
  image = ABI6_0_0RCTTransformImage(image, size, scale, transform);
  image.ReactABI6_0_0KeyframeAnimation = animation;
  return image;
}

- (ABI6_0_0RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                           callback:(ABI6_0_0RCTImageLoaderCompletionBlock)callback
{
  return [self loadImageWithTag:imageTag
                           size:CGSizeZero
                          scale:1
                     resizeMode:ABI6_0_0RCTResizeModeStretch
                  progressBlock:nil
                completionBlock:callback];
}

- (void)dequeueTasks
{
  dispatch_async(_URLCacheQueue, ^{

    // Remove completed tasks
    for (ABI6_0_0RCTNetworkTask *task in _pendingTasks.reverseObjectEnumerator) {
      switch (task.status) {
        case ABI6_0_0RCTNetworkTaskFinished:
          [_pendingTasks removeObject:task];
          _activeTasks--;
          break;
        case ABI6_0_0RCTNetworkTaskPending:
        case ABI6_0_0RCTNetworkTaskInProgress:
          // Do nothing
          break;
      }
    }

    // Start queued decode
    NSInteger activeDecodes = _scheduledDecodes - _pendingDecodes.count;
    while (activeDecodes == 0 || (_activeBytes <= _maxConcurrentDecodingBytes &&
                                  activeDecodes <= _maxConcurrentDecodingTasks)) {
      dispatch_block_t decodeBlock = _pendingDecodes.firstObject;
      if (decodeBlock) {
        [_pendingDecodes removeObjectAtIndex:0];
        decodeBlock();
      } else {
        break;
      }
    }

    // Start queued tasks
    for (ABI6_0_0RCTNetworkTask *task in _pendingTasks) {
      if (MAX(_activeTasks, _scheduledDecodes) >= _maxConcurrentLoadingTasks) {
        break;
      }
      if (task.status == ABI6_0_0RCTNetworkTaskPending) {
        [task start];
        _activeTasks++;
      }
    }
  });
}

/**
 * This returns either an image, or raw image data, depending on the loading
 * path taken. This is useful if you want to skip decoding, e.g. when preloading
 * the image, or retrieving metadata.
 */
- (ABI6_0_0RCTImageLoaderCancellationBlock)loadImageOrDataWithTag:(NSString *)imageTag
                                                     size:(CGSize)size
                                                    scale:(CGFloat)scale
                                               resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                            progressBlock:(ABI6_0_0RCTImageLoaderProgressBlock)progressHandler
                                          completionBlock:(void (^)(NSError *error, id imageOrData))completionBlock
{
  __block volatile uint32_t cancelled = 0;
  __block void(^cancelLoad)(void) = nil;
  __weak ABI6_0_0RCTImageLoader *weakSelf = self;

  void (^completionHandler)(NSError *error, id imageOrData) = ^(NSError *error, id imageOrData) {
    if ([NSThread isMainThread]) {

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

  if (imageTag.length == 0) {
    completionHandler(ABI6_0_0RCTErrorWithMessage(@"source.uri should not be an empty string"), nil);
    return ^{};
  }

  // All access to URL cache must be serialized
  if (!_URLCacheQueue) {
    [self setUp];
  }
  dispatch_async(_URLCacheQueue, ^{

    if (!_URLCache) {
      _URLCache = [[NSURLCache alloc] initWithMemoryCapacity:5 * 1024 * 1024 // 5MB
                                                diskCapacity:200 * 1024 * 1024 // 200MB
                                                    diskPath:@"ReactABI6_0_0/ABI6_0_0RCTImageDownloader"];
    }

    ABI6_0_0RCTImageLoader *strongSelf = weakSelf;
    if (cancelled || !strongSelf) {
      return;
    }

    // Find suitable image URL loader
    NSURLRequest *request = [ABI6_0_0RCTConvert NSURLRequest:imageTag];
    id<ABI6_0_0RCTImageURLLoader> loadHandler = [strongSelf imageURLLoaderForURL:request.URL];
    if (loadHandler) {
      cancelLoad = [loadHandler loadImageForURL:request.URL
                                           size:size
                                          scale:scale
                                     resizeMode:resizeMode
                                progressHandler:progressHandler
                              completionHandler:completionHandler] ?: ^{};
      return;
    }

    // Check if networking module is available
    if (ABI6_0_0RCT_DEBUG && ![_bridge respondsToSelector:@selector(networking)]) {
      ABI6_0_0RCTLogError(@"No suitable image URL loader found for %@. You may need to "
                  " import the ABI6_0_0RCTNetwork library in order to load images.",
                  imageTag);
      return;
    }

    // Check if networking module can load image
    if (ABI6_0_0RCT_DEBUG && ![_bridge.networking canHandleRequest:request]) {
      ABI6_0_0RCTLogError(@"No suitable image URL loader found for %@", imageTag);
      return;
    }

    // Use networking module to load image
    ABI6_0_0RCTURLRequestCompletionBlock processResponse =
    ^(NSURLResponse *response, NSData *data, NSError *error) {

      // Check for system errors
      if (error) {
        completionHandler(error, nil);
        return;
      } else if (!data) {
        completionHandler(ABI6_0_0RCTErrorWithMessage(@"Unknown image download error"), nil);
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

    // Add missing png extension
    if (request.URL.fileURL && request.URL.pathExtension.length == 0) {
      NSMutableURLRequest *mutableRequest = [request mutableCopy];
      mutableRequest.URL = [NSURL fileURLWithPath:[request.URL.path stringByAppendingPathExtension:@"png"]];
      request = mutableRequest;
    }

    // Check for cached response before reloading
    // TODO: move URL cache out of ABI6_0_0RCTImageLoader into its own module
    NSCachedURLResponse *cachedResponse = [_URLCache cachedResponseForRequest:request];

    while (cachedResponse) {
      if ([cachedResponse.response isKindOfClass:[NSHTTPURLResponse class]]) {
        NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)cachedResponse.response;
        if (httpResponse.statusCode == 301 || httpResponse.statusCode == 302) {
          NSString *location = httpResponse.allHeaderFields[@"Location"];
          if (location == nil) {
            completionHandler(ABI6_0_0RCTErrorWithMessage(@"Image redirect without location"), nil);
            return;
          }

          NSURL *redirectURL = [NSURL URLWithString: location];
          request = [NSURLRequest requestWithURL: redirectURL];
          cachedResponse = [_URLCache cachedResponseForRequest:request];
          continue;
        }
      }

      processResponse(cachedResponse.response, cachedResponse.data, nil);
      return;
    }

    // Download image
    ABI6_0_0RCTNetworkTask *task = [_bridge.networking networkTaskWithRequest:request completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
      if (error) {
        completionHandler(error, nil);
        return;
      }

      dispatch_async(_URLCacheQueue, ^{

        // Cache the response
        // TODO: move URL cache out of ABI6_0_0RCTImageLoader into its own module
        BOOL isHTTPRequest = [request.URL.scheme hasPrefix:@"http"];
        [strongSelf->_URLCache storeCachedResponse:
         [[NSCachedURLResponse alloc] initWithResponse:response
                                                  data:data
                                              userInfo:nil
                                         storagePolicy:isHTTPRequest ? NSURLCacheStorageAllowed: NSURLCacheStorageAllowedInMemoryOnly]
                                        forRequest:request];
        // Process image data
        processResponse(response, data, nil);

        //clean up
        [weakSelf dequeueTasks];

      });

    }];
    task.downloadProgressBlock = progressHandler;

    if (!_pendingTasks) {
      _pendingTasks = [NSMutableArray new];
    }
    if (task) {
      [_pendingTasks addObject:task];
      if (MAX(_activeTasks, _scheduledDecodes) < _maxConcurrentLoadingTasks) {
        [task start];
        _activeTasks++;
      }
    }

    cancelLoad = ^{
      [task cancel];
      [weakSelf dequeueTasks];
    };

  });

  return ^{
    if (cancelLoad) {
      cancelLoad();
    }
    OSAtomicOr32Barrier(1, &cancelled);
  };
}

- (ABI6_0_0RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                      progressBlock:(ABI6_0_0RCTImageLoaderProgressBlock)progressHandler
                                    completionBlock:(ABI6_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  return [self loadImageWithoutClipping:imageTag
                                   size:size
                                  scale:scale
                             resizeMode:resizeMode
                          progressBlock:progressHandler
                        completionBlock:^(NSError *error, UIImage *image) {
                          completionBlock(error, ABI6_0_0RCTResizeImageIfNeeded(image, size, scale, resizeMode));
                        }];
}

- (ABI6_0_0RCTImageLoaderCancellationBlock)loadImageWithoutClipping:(NSString *)imageTag
                                                       size:(CGSize)size
                                                      scale:(CGFloat)scale
                                                 resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                              progressBlock:(ABI6_0_0RCTImageLoaderProgressBlock)progressHandler
                                            completionBlock:(ABI6_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  __block volatile uint32_t cancelled = 0;
  __block void(^cancelLoad)(void) = nil;
  __weak ABI6_0_0RCTImageLoader *weakSelf = self;

  void (^completionHandler)(NSError *error, id imageOrData) = ^(NSError *error, id imageOrData) {
    if (!cancelled) {
      if (!imageOrData || [imageOrData isKindOfClass:[UIImage class]]) {
        completionBlock(error, imageOrData);
      } else {
        cancelLoad = [weakSelf decodeImageDataWithoutClipping:imageOrData
                                                         size:size
                                                        scale:scale
                                                   resizeMode:resizeMode
                                              completionBlock:completionBlock] ?: ^{};
      }
    }
  };

  cancelLoad = [self loadImageOrDataWithTag:imageTag
                                       size:size
                                      scale:scale
                                 resizeMode:resizeMode
                              progressBlock:progressHandler
                            completionBlock:completionHandler] ?: ^{};
  return ^{
    if (cancelLoad) {
      cancelLoad();
    }
    OSAtomicOr32Barrier(1, &cancelled);
  };
}

- (ABI6_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)data
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                   completionBlock:(ABI6_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  return [self decodeImageDataWithoutClipping:data
                                         size:size
                                        scale:scale
                                   resizeMode:resizeMode
                              completionBlock:^(NSError *error, UIImage *image) {
                                completionBlock(error, ABI6_0_0RCTResizeImageIfNeeded(image, size, scale, resizeMode));
                              }];
}

- (ABI6_0_0RCTImageLoaderCancellationBlock)decodeImageDataWithoutClipping:(NSData *)data
                                                             size:(CGSize)size
                                                            scale:(CGFloat)scale
                                                       resizeMode:(ABI6_0_0RCTResizeMode)resizeMode
                                                  completionBlock:(ABI6_0_0RCTImageLoaderCompletionBlock)completionBlock
{
  if (data.length == 0) {
    completionBlock(ABI6_0_0RCTErrorWithMessage(@"No image data"), nil);
    return ^{};
  }

  __block volatile uint32_t cancelled = 0;
  void (^completionHandler)(NSError *, UIImage *) = ^(NSError *error, UIImage *image) {
    if ([NSThread isMainThread]) {
      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!cancelled) {
          completionBlock(error, image);
        }
      });
    } else if (!cancelled) {
      completionBlock(error, image);
    }
  };

  id<ABI6_0_0RCTImageDataDecoder> imageDecoder = [self imageDataDecoderForData:data];
  if (imageDecoder) {
    return [imageDecoder decodeImageData:data
                                    size:size
                                   scale:scale
                              resizeMode:resizeMode
                       completionHandler:completionHandler];
  } else {

    if (!_URLCacheQueue) {
      [self setUp];
    }
    dispatch_async(_URLCacheQueue, ^{
      dispatch_block_t decodeBlock = ^{

        // Calculate the size, in bytes, that the decompressed image will require
        NSInteger decodedImageBytes = (size.width * scale) * (size.height * scale) * 4;

        // Mark these bytes as in-use
        _activeBytes += decodedImageBytes;

        // Do actual decompression on a concurrent background queue
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          if (!cancelled) {

            // Decompress the image data (this may be CPU and memory intensive)
            UIImage *image = ABI6_0_0RCTDecodeImageWithData(data, size, scale, resizeMode);

#if ABI6_0_0RCT_DEV

            CGSize imagePixelSize = ABI6_0_0RCTSizeInPixels(image.size, image.scale);
            CGSize screenPixelSize = ABI6_0_0RCTSizeInPixels(ABI6_0_0RCTScreenSize(), ABI6_0_0RCTScreenScale());
            if (imagePixelSize.width * imagePixelSize.height >
                screenPixelSize.width * screenPixelSize.height) {
              ABI6_0_0RCTLogInfo(@"[PERF ASSETS] Loading image at size %@, which is larger "
                         "than the screen size %@", NSStringFromCGSize(imagePixelSize),
                         NSStringFromCGSize(screenPixelSize));
            }

#endif

            if (image) {
              completionHandler(nil, image);
            } else {
              NSString *errorMessage = [NSString stringWithFormat:@"Error decoding image data <NSData %p; %tu bytes>", data, data.length];
              NSError *finalError = ABI6_0_0RCTErrorWithMessage(errorMessage);
              completionHandler(finalError, nil);
            }
          }

          // We're no longer retaining the uncompressed data, so now we'll mark
          // the decoding as complete so that the loading task queue can resume.
          dispatch_async(_URLCacheQueue, ^{
            _scheduledDecodes--;
            _activeBytes -= decodedImageBytes;
            [self dequeueTasks];
          });
        });
      };

      // The decode operation retains the compressed image data until it's
      // complete, so we'll mark it as having started, in order to block
      // further image loads from happening until we're done with the data.
      _scheduledDecodes++;

      if (!_pendingDecodes) {
        _pendingDecodes = [NSMutableArray new];
      }
      NSInteger activeDecodes = _scheduledDecodes - _pendingDecodes.count - 1;
      if (activeDecodes == 0 || (_activeBytes <= _maxConcurrentDecodingBytes &&
                                 activeDecodes <= _maxConcurrentDecodingTasks)) {
        decodeBlock();
      } else {
        [_pendingDecodes addObject:decodeBlock];
      }

    });

    return ^{
      OSAtomicOr32Barrier(1, &cancelled);
    };
  }
}

- (ABI6_0_0RCTImageLoaderCancellationBlock)getImageSize:(NSString *)imageTag
                                          block:(void(^)(NSError *error, CGSize size))completionBlock
{
  return [self loadImageOrDataWithTag:imageTag
                                 size:CGSizeZero
                                scale:1
                           resizeMode:ABI6_0_0RCTResizeModeStretch
                        progressBlock:nil
                      completionBlock:^(NSError *error, id imageOrData) {
                        CGSize size;
                        if ([imageOrData isKindOfClass:[NSData class]]) {
                          NSDictionary *meta = ABI6_0_0RCTGetImageMetadata(imageOrData);
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

#pragma mark - Bridged methods

ABI6_0_0RCT_EXPORT_METHOD(prefetchImage:(NSString *)uri
                        resolve:(ABI6_0_0RCTPromiseResolveBlock)resolve
                         reject:(ABI6_0_0RCTPromiseRejectBlock)reject)
{
  if (!uri.length) {
    reject(ABI6_0_0RCTErrorInvalidURI, @"Cannot prefetch an image for an empty URI", nil);
    return;
  }

  [_bridge.imageLoader loadImageWithTag:uri callback:^(NSError *error, UIImage *image) {
    if (error) {
      reject(ABI6_0_0RCTErrorPrefetchFailure, nil, error);
      return;
    }

    resolve(@YES);
  }];
}

#pragma mark - ABI6_0_0RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  NSURL *requestURL = request.URL;
  for (id<ABI6_0_0RCTImageURLLoader> loader in _loaders) {
    // Don't use ABI6_0_0RCTImageURLLoader protocol for modules that already conform to
    // ABI6_0_0RCTURLRequestHandler as it's inefficient to decode an image and then
    // convert it back into data
    if (![loader conformsToProtocol:@protocol(ABI6_0_0RCTURLRequestHandler)] &&
        [loader canLoadImageURL:requestURL]) {
      return YES;
    }
  }
  return NO;
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<ABI6_0_0RCTURLRequestDelegate>)delegate
{
  __block ABI6_0_0RCTImageLoaderCancellationBlock requestToken;
  requestToken = [self loadImageWithTag:request.URL.absoluteString callback:^(NSError *error, UIImage *image) {
    if (error) {
      [delegate URLRequest:requestToken didCompleteWithError:error];
      return;
    }

    NSString *mimeType = nil;
    NSData *imageData = nil;
    if (ABI6_0_0RCTImageHasAlpha(image.CGImage)) {
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
    ((ABI6_0_0RCTImageLoaderCancellationBlock)requestToken)();
  }
}

@end

@implementation ABI6_0_0RCTBridge (ABI6_0_0RCTImageLoader)

- (ABI6_0_0RCTImageLoader *)imageLoader
{
  return [self moduleForClass:[ABI6_0_0RCTImageLoader class]];
}

@end
