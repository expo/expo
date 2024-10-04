// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCachedResource.h"
#import "EXEnvironment.h"
#import "EXFileDownloader.h"
#import "EXKernelUtil.h"
#import "EXUtil.h"
#import "EXVersions.h"

#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXLoadingProgress

@end

@interface EXCachedResource ()

@property (nonatomic, strong) NSString *resourceName;
@property (nonatomic, strong) NSString *resourceType;
@property (nonatomic, strong) NSString *cachePath;

@end

@implementation EXCachedResource

static dispatch_queue_t _reapingQueue;

- (instancetype)initWithResourceName:(NSString *)resourceName resourceType:(NSString *)resourceType remoteUrl:(nonnull NSURL *)url cachePath:(NSString * _Nullable)cachePath
{
  if (self = [super init]) {
    _shouldVersionCache = YES;
    _resourceName = [EXUtil escapedResourceName:resourceName];
    _resourceType = resourceType;
    _remoteUrl = url;
    _cachePath = (cachePath) ? cachePath : [self _defaultCachePath];
  }
  return self;
}

- (void)loadResourceWithBehavior:(EXCachedResourceBehavior)behavior
                   progressBlock:(__nullable EXCachedResourceProgressBlock)progressBlock
                    successBlock:(EXCachedResourceSuccessBlock)success
                      errorBlock:(EXCachedResourceErrorBlock)error
{
  switch (behavior) {
    case EXCachedResourceNoCache: {
      NSLog(@"EXCachedResource: Not using cache for %@", _resourceName);
      [self _loadRemoteResourceWithSuccess:success error:error ignoringCache:YES];
      break;
    }
    case EXCachedResourceWriteToCache: {
      [self _loadRemoteAndWriteToCacheWithSuccess:success error:error];
      break;
    }
    case EXCachedResourceUseCacheImmediately: {
      [self _loadCacheImmediatelyAndDownload:YES withSuccess:success error:error];
      break;
    }
    case EXCachedResourceFallBackToNetwork: {
      [self _loadCacheAndDownloadConditionallyWithSuccess:success error:error];
      break;
    }
    case EXCachedResourceFallBackToCache: default: {
      [self _loadRemoteAndFallBackToCacheWithSuccess:success error:error];
      break;
    }
    case EXCachedResourceOnlyCache: {
      [self _loadCacheImmediatelyAndDownload:NO withSuccess:success error:error];
      break;
    }
  }
}

/**
 *  If @ignoreCache is true, make sure NSURLSession busts any existing cache.
 */
- (void)_loadRemoteResourceWithSuccess:(EXCachedResourceSuccessBlock)successBlock
                                 error:(EXCachedResourceErrorBlock)errorBlock
                         ignoringCache:(BOOL)ignoreCache
{
  EXFileDownloader *downloader = [[EXFileDownloader alloc] init];
  if (_requestTimeoutInterval) {
    downloader.timeoutInterval = _requestTimeoutInterval;
  }
  if (_abiVersion) {
    downloader.abiVersion = _abiVersion;
  }
  if (_releaseChannel){
    downloader.releaseChannel = _releaseChannel;
  }
  if (_urlCache || ignoreCache) {
    NSURLSessionConfiguration *customConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
    if (_urlCache) {
      customConfiguration.URLCache = _urlCache;
    }
    if (ignoreCache) {
      customConfiguration.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
    }
    downloader.urlSessionConfiguration = customConfiguration;
  }

  [downloader downloadFileFromURL:_remoteUrl successBlock:^(NSData *data, NSURLResponse *response) {
    NSError *err = [self _validateResponseData:data response:response];
    if (err) {
      errorBlock(err);
    } else {
      successBlock(data);
    }
  } errorBlock:^(NSError *error, NSURLResponse *response) {
    NSError *err = [self _validateErrorData:error response:response];
    errorBlock(err);
  }];
}

- (void)_loadCacheImmediatelyAndDownload:(BOOL)shouldAttemptDownload
                             withSuccess:(EXCachedResourceSuccessBlock)successBlock
                                   error:(EXCachedResourceErrorBlock)errorBlock
{
  BOOL hasLocalBundle = NO;
  NSString *resourceCachePath = [self resourceCachePath];
  NSString *resourceLocalPath = [self _resourceLocalPathPreferringCache];
  
  // check cache
  if (resourceLocalPath) {
    NSData *data = [NSData dataWithContentsOfFile:resourceLocalPath];
    if (data && data.length) {
      hasLocalBundle = YES;
      NSLog(@"EXCachedResource: Using cached resource at %@...", resourceLocalPath);
      successBlock(data);
    }
  }
  
  if (shouldAttemptDownload) {
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

    [self _loadRemoteResourceWithSuccess:onSuccess error:onError ignoringCache:NO];
  } else {
    // download not allowed, and we found no cached data, so fail
    if (!hasLocalBundle) {
      errorBlock(RCTErrorWithMessage([NSString stringWithFormat:@"No cache exists for this resource: %@.%@", _resourceName, _resourceType]));
    }
  }
}

- (void)_loadRemoteAndWriteToCacheWithSuccess:(EXCachedResourceSuccessBlock)successBlock
                                           error:(EXCachedResourceErrorBlock)errorBlock
{
  NSString *resourceCachePath = [self resourceCachePath];

  [self _loadRemoteResourceWithSuccess:^(NSData * _Nonnull data) {
    // write to cache for next time
    NSLog(@"EXCachedResource: Caching resource to %@...", resourceCachePath);
    [data writeToFile:resourceCachePath atomically:YES];
    successBlock(data);
  } error:errorBlock ignoringCache:YES];
}

- (void)_loadRemoteAndFallBackToCacheWithSuccess:(EXCachedResourceSuccessBlock)successBlock
                                           error:(EXCachedResourceErrorBlock)errorBlock
{
  NSString *resourceCachePath = [self resourceCachePath];
  NSString *resourceLocalPath = [self _resourceLocalPathPreferringCache];

  [self _loadRemoteResourceWithSuccess:^(NSData * _Nonnull data) {
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
  } ignoringCache:NO];
}

- (void)_loadCacheAndDownloadConditionallyWithSuccess:(EXCachedResourceSuccessBlock)successBlock
                                                error:(EXCachedResourceErrorBlock)errorBlock
{
  [self _loadCacheImmediatelyAndDownload:NO withSuccess:successBlock error:^(NSError * _Nonnull error) {
    [self _loadRemoteAndWriteToCacheWithSuccess:successBlock error:errorBlock];
  }];
}

- (NSString *)_resourceCacheFilenameUsingLegacy:(BOOL)useLegacy
{
  NSString *base;

  // this is versioned because it can persist between updates of native code
  if (_shouldVersionCache) {
    NSString *prefix = _abiVersion && _abiVersion.length > 0 ? _abiVersion : [EXVersions sharedInstance].temporarySdkVersion;
    base = [NSString stringWithFormat:@"%@-%@", prefix ?: @"", _resourceName];
  } else {
    base = _resourceName;
  }

  if (useLegacy) {
    return base;
  } else {
    return [NSString stringWithFormat:@"%@-%lu", base, (unsigned long)[_remoteUrl hash]];
  }
}

- (NSString *)resourceCachePath
{
  NSString *versionedResourceFilename = [NSString stringWithFormat:@"%@.%@", [self _resourceCacheFilenameUsingLegacy:NO], _resourceType];
  return [_cachePath stringByAppendingPathComponent:versionedResourceFilename];
}

- (NSString *)resourceBundlePath
{
  return [[NSBundle mainBundle] pathForResource:_resourceName ofType:_resourceType];
}

- (NSString *)_resourceLocalPathPreferringCache
{
  if ([self isUsingEmbeddedResource]) {
    return [self resourceBundlePath];
  }
  return [self resourceCachePath];
}

- (BOOL)isUsingEmbeddedResource
{
  // by default, only use the embedded resource if no cached copy exists
  // but this behavior can be overridden by subclasses
  NSString *localPath = [self resourceCachePath];
  return ![[NSFileManager defaultManager] fileExistsAtPath:localPath isDirectory:nil];
}

- (BOOL)removeCache
{
  NSString *localPath = [self resourceCachePath];
  if ([[NSFileManager defaultManager] fileExistsAtPath:localPath isDirectory:nil]) {
    NSError *error;
    [[NSFileManager defaultManager] removeItemAtPath:localPath error:&error];
    return (error == nil);
  }
  return NO;
}

- (NSError *)_validateResponseData:(NSData *)data response:(NSURLResponse *)response
{
  // always valid
  return nil;
}

- (NSError *)_validateErrorData:(NSError *)error response:(NSURLResponse *)response
{
  NSError *networkError = [NSError errorWithDomain:EXNetworkErrorDomain code:error.code userInfo:error.userInfo];
  return networkError;
}

- (NSString *)_defaultCachePath
{
  return [[self class] cachePathWithName:@"EXCachedResource"];
}

+ (NSString *)cachePathWithName:(NSString *)cacheName
{
  NSString *cachesDirectory = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *sourceDirectory = [cachesDirectory stringByAppendingPathComponent:cacheName];
  NSString *sourceDirectoryVersioned = sourceDirectory;
  
  BOOL cacheDirectoryExists = [[NSFileManager defaultManager] fileExistsAtPath:sourceDirectoryVersioned isDirectory:nil];
  if (!cacheDirectoryExists) {
    NSError *error;
    BOOL created = [[NSFileManager defaultManager] createDirectoryAtPath:sourceDirectoryVersioned
                                             withIntermediateDirectories:YES
                                                              attributes:nil
                                                                   error:&error];
    if (created) {
      cacheDirectoryExists = YES;
    } else {
      DDLogError(@"Could not create source cache directory: %@", error.localizedDescription);
    }
  }
  
  return (cacheDirectoryExists) ? sourceDirectoryVersioned : nil;
}

@end

NS_ASSUME_NONNULL_END
