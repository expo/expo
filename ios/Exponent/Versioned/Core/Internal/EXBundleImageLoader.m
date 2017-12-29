// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBundleImageLoader.h"

#import <stdatomic.h>
#import <React/RCTUtils.h>

#import "EXScopedModuleRegistry.h"
#import "EXResourceLoader.h"
#import "EXFileSystem.h"

@interface EXBundleImageLoader ()

@property (nonatomic, weak) id cachedResourceServiceDelegate;

@end

@implementation EXBundleImageLoader

@synthesize bridge = _bridge;

EX_EXPORT_SCOPED_MODULE(ExponentBundleImageLoader, CachedResourceManager);

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
  // EXCachedResource handles the caching automatically so we don't want
  // to add it to the image cache.
  return NO;
}

- (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                   progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                partialLoadHandler:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  __block atomic_bool cancelled = ATOMIC_VAR_INIT(NO);
  id resource =
    [_cachedResourceServiceDelegate createCachedResourceWithName:imageURL.pathComponents.lastObject
                                                    resourceType:@""
                                                       remoteUrl:imageURL
                                                       cachePath:self.bridge.scopedModules.fileSystem.cachesDirectory];
  [resource loadResourceWithBehavior:EXCachedResourceUseCacheImmediately progressBlock:nil successBlock:^(NSData * _Nonnull data) {
    completionHandler(nil, [UIImage imageWithData:data]);
  } errorBlock:^(NSError * _Nonnull error) {
    completionHandler(error, nil);
  }];
  
  return ^{
    atomic_store(&cancelled, YES);
  };
}

@end

