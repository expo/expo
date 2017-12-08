// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXBundleImageLoader.h"

#import <stdatomic.h>
#import <ReactABI24_0_0/ABI24_0_0RCTUtils.h>

#import "ABI24_0_0EXScopedModuleRegistry.h"
#import "ABI24_0_0EXResourceLoader.h"
#import "ABI24_0_0EXFileSystem.h"

@interface ABI24_0_0EXBundleImageLoader ()

@property (nonatomic, weak) id cachedResourceServiceDelegate;

@end

@implementation ABI24_0_0EXBundleImageLoader

@synthesize bridge = _bridge;

ABI24_0_0EX_EXPORT_SCOPED_MODULE(ExponentBundleImageLoader, CachedResourceManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _cachedResourceServiceDelegate = kernelServiceInstance;
  }
  return self;
}

- (float)handlerPriority
{
  return 2;
}

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return [requestURL.absoluteString hasPrefix:@"https://d1wp6m56sqw74a.cloudfront.net/~assets/"];
}

- (BOOL)requiresScheduling
{
  return NO;
}

- (BOOL)shouldCacheLoadedImages
{
  // ABI24_0_0EXCachedResource handles the caching automatically so we don't want
  // to add it to the image cache.
  return NO;
}

- (ABI24_0_0RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI24_0_0RCTResizeMode)resizeMode
                                   progressHandler:(ABI24_0_0RCTImageLoaderProgressBlock)progressHandler
                                partialLoadHandler:(ABI24_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                 completionHandler:(ABI24_0_0RCTImageLoaderCompletionBlock)completionHandler
{
  __block atomic_bool cancelled = ATOMIC_VAR_INIT(NO);
  id resource =
    [_cachedResourceServiceDelegate createCachedResourceWithName:imageURL.pathComponents.lastObject
                                                    resourceType:@""
                                                       remoteUrl:imageURL
                                                       cachePath:self.bridge.scopedModules.fileSystem.cachesDirectory];
  [resource loadResourceWithBehavior:ABI24_0_0EXCachedResourceUseCacheImmediately progressBlock:nil successBlock:^(NSData * _Nonnull data) {
    completionHandler(nil, [UIImage imageWithData:data]);
  } errorBlock:^(NSError * _Nonnull error) {
    completionHandler(error, nil);
  }];
  
  return ^{
    atomic_store(&cancelled, YES);
  };
}

@end

