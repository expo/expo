// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * This is the versioned protocol for ABI30_0_0EXCachedResource, this also defines some
 * of the types used when interacting with ABI30_0_0EXCachedResource instances. This is
 * used with the ABI30_0_0EXCachedResourceManager service to be able to create ABI30_0_0EXCachedResource
 * instances in versioned code.
 *
 * **Avoid making breaking changes to this and if you do make sure to edit all
 * versions of this file.**
 */

@interface ABI30_0_0EXLoadingProgress : NSObject

@property (nonatomic, copy) NSString *status;
@property (nonatomic, strong) NSNumber *done;
@property (nonatomic, strong) NSNumber *total;

@end

typedef void (^ABI30_0_0EXCachedResourceSuccessBlock)(NSData *data);
typedef void (^ABI30_0_0EXCachedResourceErrorBlock)(NSError *error);
typedef void (^ABI30_0_0EXCachedResourceProgressBlock)(ABI30_0_0EXLoadingProgress *progress);

typedef enum ABI30_0_0EXCachedResourceBehavior {
  // load the resource without using any cache.
  ABI30_0_0EXCachedResourceNoCache,
  // load the resource without reading from the cache, but still write the loaded resource to the cache.
  ABI30_0_0EXCachedResourceWriteToCache,
  // return immediately with cached data if it exists, then try to download the resource and replace the cache in the background.
  ABI30_0_0EXCachedResourceUseCacheImmediately,
  // return immediately with cached data if it exists, and only try to download the resource if cached data is not found.
  ABI30_0_0EXCachedResourceFallBackToNetwork,
  // try to download the resource, but fall back to the cached version if the download fails.
  ABI30_0_0EXCachedResourceFallBackToCache,
  // use a cache if it exists, otherwise fail. (don't download anything)
  ABI30_0_0EXCachedResourceOnlyCache,
} ABI30_0_0EXCachedResourceBehavior;

typedef enum ABI30_0_0EXManifestCacheBehavior {
  // load the manifest without using any cache.
  ABI30_0_0EXManifestNoCache,
  // use a cache if it exists, otherwise fail. (don't download anything)
  ABI30_0_0EXManifestOnlyCache,
  // load the resource without reading from the cache, but still prepare to write the loaded resource to the cache.
  ABI30_0_0EXManifestPrepareToCache,
} ABI30_0_0EXManifestCacheBehavior;

@protocol ABI30_0_0EXResourceLoader

- (void)loadResourceWithBehavior:(ABI30_0_0EXCachedResourceBehavior)behavior
                   progressBlock:(__nullable ABI30_0_0EXCachedResourceProgressBlock)progressBlock
                    successBlock:(ABI30_0_0EXCachedResourceSuccessBlock)successBlock
                      errorBlock:(ABI30_0_0EXCachedResourceErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
