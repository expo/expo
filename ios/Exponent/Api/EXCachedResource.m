// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCachedResource.h"
#import "EXFileDownloader.h"
#import "EXVersionManager.h"
#import "EXVersions.h"
#import "EXKernelUtil.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXCachedResource ()

@property (nonatomic, strong) NSString *resourceName;
@property (nonatomic, strong) NSString *resourceType;
@property (nonatomic, strong) NSURL *remoteUrl;
@property (nonatomic, strong) NSString *cachePath;

@end

@implementation EXCachedResource

- (instancetype)initWithResourceName:(NSString *)resourceName resourceType:(NSString *)resourceType remoteUrl:(nonnull NSURL *)url cachePath:(NSString * _Nullable)cachePath
{
  if (self = [super init]) {
    _shouldVersionCache = YES;
    _resourceName = [EXVersionManager escapedResourceName:resourceName];
    _resourceType = resourceType;
    _remoteUrl = url;
    _cachePath = (cachePath) ? cachePath : [self _defaultCachePath];
  }
  return self;
}

- (void)loadResourceWithBehavior:(EXCachedResourceBehavior)behavior
                    successBlock:(EXCachedResourceSuccessBlock)success
                      errorBlock:(EXCachedResourceErrorBlock)error
{
  switch (behavior) {
    case kEXCachedResourceNoCache: {
      NSLog(@"EXCachedResource: Not using cache for %@", _resourceName);
      [self loadRemoteResourceWithSuccess:success error:error];
      break;
    }
    case kEXCachedResourceUseCacheImmediately: {
      [self _loadCacheImmediatelyWithSuccess:success error:error];
      break;
    }
    case kEXCachedResourceFallBackToCache: default: {
      [self _loadRemoteAndFallBackToCacheWithSuccess:success error:error];
      break;
    }
  }
}

- (void)loadRemoteResourceWithSuccess:(EXCachedResourceSuccessBlock)successBlock
                                 error:(EXCachedResourceErrorBlock)errorBlock
{
  EXFileDownloader *downloader = [[EXFileDownloader alloc] init];
  if (_requestTimeoutInterval) {
    downloader.timeoutInterval = _requestTimeoutInterval;
  }
  if (_abiVersion) {
    downloader.abiVersion = _abiVersion;
  }
  if (_urlCache) {
    downloader.urlCache = _urlCache;
  }

  [downloader downloadFileFromURL:_remoteUrl successBlock:^(NSData *data, NSURLResponse *response) {
    NSError *err = [self _validateResponseData:data response:response];
    if (err) {
      errorBlock(err);
    } else {
      successBlock(data);
    }
  } errorBlock:^(NSError *error, NSURLResponse *response) {
    NSError *networkError = [NSError errorWithDomain:EXNetworkErrorDomain code:error.code userInfo:error.userInfo];
    errorBlock(networkError);
  }];
}

- (void)_loadCacheImmediatelyWithSuccess:(EXCachedResourceSuccessBlock)successBlock
                                   error:(EXCachedResourceErrorBlock)errorBlock
{
  BOOL hasLocalBundle = NO;
  NSString *resourceCachePath = [self resourceCachePath];
  NSString *resourceLocalPath = [self resourceLocalPathPreferringCache];
  
  // check cache
  if (resourceLocalPath) {
    NSData *data = [NSData dataWithContentsOfFile:resourceLocalPath];
    if (data && data.length) {
      hasLocalBundle = YES;
      NSLog(@"EXCachedResource: Using cached resource at %@...", resourceLocalPath);
      successBlock(data);
    }
  }
  
  EXCachedResourceSuccessBlock onSuccess = ^(NSData *data) {
    if (!hasLocalBundle) {
      // no local bundle found, so call back with the newly downloaded resource
      successBlock(data);
    }
    
    // write to cache for next time
    NSLog(@"EXCachedResource: Caching resource to %@...", resourceCachePath);
    [data writeToFile:resourceCachePath atomically:YES];
  };
  EXCachedResourceErrorBlock onError = ^(NSError *error) {
    if (!hasLocalBundle) {
      // no local bundle found, and download failed, so call back with the bad news
      errorBlock(error);
    }
  };

  [self loadRemoteResourceWithSuccess:onSuccess error:onError];
}

- (void)_loadRemoteAndFallBackToCacheWithSuccess:(EXCachedResourceSuccessBlock)successBlock
                                           error:(EXCachedResourceErrorBlock)errorBlock
{
  NSString *resourceCachePath = [self resourceCachePath];
  NSString *resourceLocalPath = [self resourceLocalPathPreferringCache];

  [self loadRemoteResourceWithSuccess:^(NSData * _Nonnull data) {
    // write to cache for next time
    NSLog(@"EXCachedResource: Caching resource to %@...", resourceCachePath);
    [data writeToFile:resourceCachePath atomically:YES];
    successBlock(data);
  } error:^(NSError * _Nonnull error) {
    // failed, check cache instead
    BOOL hasLocalBundle = NO;
    if (resourceLocalPath) {
      NSData *data = [NSData dataWithContentsOfFile:resourceLocalPath];
      if (data && data.length) {
        hasLocalBundle = YES;
        NSLog(@"EXCachedResource: Using cached resource at %@...", resourceLocalPath);
        successBlock(data);
      }
    }
    if (!hasLocalBundle) {
      errorBlock(error);
    }
  }];
}

- (NSString *)resourceCachePath
{
  // this is versioned because it can persist between updates of native code
  NSString *resourceFilename = [NSString stringWithFormat:@"%@.%@", _resourceName, _resourceType];
  NSString *versionedResourceFilename;
  if (_shouldVersionCache) {
    versionedResourceFilename = [NSString stringWithFormat:@"%@-%@", (_abiVersion) ?: [EXVersions sharedInstance].temporarySdkVersion, resourceFilename];
  } else {
    versionedResourceFilename = resourceFilename;
  }
  return [_cachePath stringByAppendingPathComponent:versionedResourceFilename];
}

- (NSString *)resourceLocalPathPreferringCache
{
  NSString *localPath = [self resourceCachePath];
  if (![[NSFileManager defaultManager] fileExistsAtPath:localPath isDirectory:nil]) {
    // nothing in cache, check NSBundle
    localPath = [[NSBundle mainBundle] pathForResource:_resourceName ofType:_resourceType];
  }
  return localPath;
}

- (NSError *)_validateResponseData:(NSData *)data response:(NSURLResponse *)response
{
  // always valid
  return nil;
}

- (NSString *)_defaultCachePath
{
  NSString *cachesDirectory = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *sourceDirectory = [cachesDirectory stringByAppendingPathComponent:@"EXCachedResource"];
  
  BOOL cacheDirectoryExists = [[NSFileManager defaultManager] fileExistsAtPath:sourceDirectory isDirectory:nil];
  if (!cacheDirectoryExists) {
    NSError *error;
    BOOL created = [[NSFileManager defaultManager] createDirectoryAtPath:sourceDirectory
                                             withIntermediateDirectories:YES
                                                              attributes:nil
                                                                   error:&error];
    if (created) {
      cacheDirectoryExists = YES;
    } else {
      DDLogError(@"Could not create source cache directory: %@", error.localizedDescription);
    }
  }
  
  return (cacheDirectoryExists) ? sourceDirectory : nil;
}

@end

NS_ASSUME_NONNULL_END
