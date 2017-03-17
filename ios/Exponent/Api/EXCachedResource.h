// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXCachedResourceSuccessBlock)(NSData *data);
typedef void (^EXCachedResourceErrorBlock)(NSError *error);

typedef enum EXCachedResourceBehavior {
  // load the resource without using any cache.
  kEXCachedResourceNoCache,
  // return immediately with cached data if it exists, then try to download the resource and replace the cache in the background.
  kEXCachedResourceUseCacheImmediately,
  // try to download the resource, but fall back to the cached version if the download fails.
  kEXCachedResourceFallBackToCache,
  // use a cache if it exists, otherwise fail. (don't download anything)
  kEXCachedResourceOnlyCache,
} EXCachedResourceBehavior;

@interface EXCachedResource : NSObject

@property (nonatomic, assign) BOOL shouldVersionCache;
@property (nonatomic, strong, nullable) NSString *abiVersion;
@property (nonatomic, strong) NSURLCache *urlCache;
@property (nonatomic, assign) NSTimeInterval requestTimeoutInterval;

- (instancetype)initWithResourceName:(NSString *)resourceName
                        resourceType:(NSString *)resourceType
                           remoteUrl:(NSURL *)url
                           cachePath:(NSString * _Nullable)cachePath;

- (void)loadResourceWithBehavior:(EXCachedResourceBehavior)behavior
                    successBlock:(EXCachedResourceSuccessBlock)successBlock
                      errorBlock:(EXCachedResourceErrorBlock)errorBlock;

/**
 *  Filesystem path to the downloaded and cached copy of this resource.
 */
- (NSString *)resourceCachePath;
/**
 *  Returns [self resourceCachePath] if a file exists there. Otherwise returns a NSBundle path.
 */
- (NSString *)resourceLocalPathPreferringCache;

- (NSError *)_validateResponseData:(NSData *)data response:(NSURLResponse *)response;

/**
 *  Returns whether a cache was removed.
 */
- (BOOL)removeCache;

@end

NS_ASSUME_NONNULL_END
