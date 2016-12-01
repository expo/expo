// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXCachedResourceSuccessBlock)(NSData *data);
typedef void (^EXCachedResourceErrorBlock)(NSError *error);

typedef enum EXCachedResourceBehavior {
  // same as calling - loadRemoteResource...
  kEXCachedResourceNoCache,
  // return immediately with cached data if it exists, then try to download the resource and replace the cache in the background.
  kEXCachedResourceUseCacheImmediately,
  // try to download the resource, but fall back to the cached version if the download fails.
  kEXCachedResourceFallBackToCache,
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

- (void)loadRemoteResourceWithSuccess:(EXCachedResourceSuccessBlock)successBlock
                                error:(EXCachedResourceErrorBlock)errorBlock;

- (NSString *)resourceCachePath;
- (NSString *)resourceLocalPathPreferringCache;
- (NSError *)_validateResponseData:(NSData *)data response:(NSURLResponse *)response;

@end

NS_ASSUME_NONNULL_END
