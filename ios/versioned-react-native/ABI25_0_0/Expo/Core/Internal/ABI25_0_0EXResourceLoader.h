// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * This is the versioned protocol for ABI25_0_0EXCachedResource, this also defines some
 * of the types used when interacting with ABI25_0_0EXCachedResource instances. This is
 * used with the ABI25_0_0EXCachedResourceManager service to be able to create ABI25_0_0EXCachedResource
 * instances in versioned code.
 *
 * **Avoid making breaking changes to this and if you do make sure to edit all
 * versions of this file.**
 */

@interface ABI25_0_0EXLoadingProgress : NSObject

@property (nonatomic, copy) NSString *status;
@property (nonatomic, strong) NSNumber *done;
@property (nonatomic, strong) NSNumber *total;

@end

typedef void (^ABI25_0_0EXCachedResourceSuccessBlock)(NSData *data);
typedef void (^ABI25_0_0EXCachedResourceErrorBlock)(NSError *error);
typedef void (^ABI25_0_0EXCachedResourceProgressBlock)(ABI25_0_0EXLoadingProgress *progress);

typedef enum ABI25_0_0EXCachedResourceBehavior {
  // load the resource without using any cache.
  ABI25_0_0EXCachedResourceNoCache,
  // return immediately with cached data if it exists, then try to download the resource and replace the cache in the background.
  ABI25_0_0EXCachedResourceUseCacheImmediately,
  // try to download the resource, but fall back to the cached version if the download fails.
  ABI25_0_0EXCachedResourceFallBackToCache,
  // use a cache if it exists, otherwise fail. (don't download anything)
  ABI25_0_0EXCachedResourceOnlyCache,
} ABI25_0_0EXCachedResourceBehavior;

@protocol ABI25_0_0EXResourceLoader

- (void)loadResourceWithBehavior:(ABI25_0_0EXCachedResourceBehavior)behavior
                   progressBlock:(__nullable ABI25_0_0EXCachedResourceProgressBlock)progressBlock
                    successBlock:(ABI25_0_0EXCachedResourceSuccessBlock)successBlock
                      errorBlock:(ABI25_0_0EXCachedResourceErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
