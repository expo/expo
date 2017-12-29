// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * This is the versioned protocol for ABI24_0_0EXCachedResource, this also defines some
 * of the types used when interacting with ABI24_0_0EXCachedResource instances. This is
 * used with the ABI24_0_0EXCachedResourceManager service to be able to create ABI24_0_0EXCachedResource
 * instances in versioned code.
 *
 * **Avoid making breaking changes to this and if you do make sure to edit all
 * versions of this file.**
 */

@interface ABI24_0_0EXLoadingProgress : NSObject

@property (nonatomic, copy) NSString *status;
@property (nonatomic, strong) NSNumber *done;
@property (nonatomic, strong) NSNumber *total;

@end

typedef void (^ABI24_0_0EXCachedResourceSuccessBlock)(NSData *data);
typedef void (^ABI24_0_0EXCachedResourceErrorBlock)(NSError *error);
typedef void (^ABI24_0_0EXCachedResourceProgressBlock)(ABI24_0_0EXLoadingProgress *progress);

typedef enum ABI24_0_0EXCachedResourceBehavior {
  // load the resource without using any cache.
  ABI24_0_0EXCachedResourceNoCache,
  // return immediately with cached data if it exists, then try to download the resource and replace the cache in the background.
  ABI24_0_0EXCachedResourceUseCacheImmediately,
  // try to download the resource, but fall back to the cached version if the download fails.
  ABI24_0_0EXCachedResourceFallBackToCache,
  // use a cache if it exists, otherwise fail. (don't download anything)
  ABI24_0_0EXCachedResourceOnlyCache,
} ABI24_0_0EXCachedResourceBehavior;

@protocol ABI24_0_0EXResourceLoader

- (void)loadResourceWithBehavior:(ABI24_0_0EXCachedResourceBehavior)behavior
                   progressBlock:(__nullable ABI24_0_0EXCachedResourceProgressBlock)progressBlock
                    successBlock:(ABI24_0_0EXCachedResourceSuccessBlock)successBlock
                      errorBlock:(ABI24_0_0EXCachedResourceErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
