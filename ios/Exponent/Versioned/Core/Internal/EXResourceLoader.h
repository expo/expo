// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * This is the versioned protocol for EXCachedResource, this also defines some
 * of the types used when interacting with EXCachedResource instances. This is
 * used with the EXCachedResourceManager service to be able to create EXCachedResource
 * instances in versioned code.
 *
 * **Avoid making breaking changes to this and if you do make sure to edit all
 * versions of this file.**
 */

@interface EXLoadingProgress : NSObject

@property (nonatomic, copy) NSString *status;
@property (nonatomic, strong) NSNumber *done;
@property (nonatomic, strong) NSNumber *total;

@end

typedef void (^EXCachedResourceSuccessBlock)(NSData *data);
typedef void (^EXCachedResourceErrorBlock)(NSError *error);
typedef void (^EXCachedResourceProgressBlock)(EXLoadingProgress *progress);

typedef enum EXCachedResourceBehavior {
  // load the resource without using any cache.
  EXCachedResourceNoCache,
  // load the resource without reading from the cache, but still write the loaded resource to the cache.
  EXCachedResourceWriteToCache,
  // return immediately with cached data if it exists, then try to download the resource and replace the cache in the background.
  EXCachedResourceUseCacheImmediately,
  // return immediately with cached data if it exists, and only try to download the resource if cached data is not found.
  EXCachedResourceFallBackToNetwork,
  // try to download the resource, but fall back to the cached version if the download fails.
  EXCachedResourceFallBackToCache,
  // use a cache if it exists, otherwise fail. (don't download anything)
  EXCachedResourceOnlyCache,
} EXCachedResourceBehavior;

typedef enum EXManifestCacheBehavior {
  // load the manifest without using any cache.
  EXManifestNoCache,
  // use a cache if it exists, otherwise fail. (don't download anything)
  EXManifestOnlyCache,
  // load the resource without reading from the cache, but still prepare to write the loaded resource to the cache.
  EXManifestPrepareToCache,
} EXManifestCacheBehavior;

@protocol EXResourceLoader

- (void)loadResourceWithBehavior:(EXCachedResourceBehavior)behavior
                   progressBlock:(__nullable EXCachedResourceProgressBlock)progressBlock
                    successBlock:(EXCachedResourceSuccessBlock)successBlock
                      errorBlock:(EXCachedResourceErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
