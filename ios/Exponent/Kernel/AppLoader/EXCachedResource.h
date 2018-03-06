// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import "EXResourceLoader.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXCachedResource : NSObject <EXResourceLoader>

@property (nonatomic, strong) NSURL *remoteUrl;
@property (nonatomic, assign) BOOL shouldVersionCache;
@property (nonatomic, strong, nullable) NSString *abiVersion;
@property (nonatomic, strong) NSURLCache *urlCache;
@property (nonatomic, assign) NSTimeInterval requestTimeoutInterval;
@property (nonatomic, strong, nullable) NSString *releaseChannel;

- (instancetype)initWithResourceName:(NSString *)resourceName
                        resourceType:(NSString *)resourceType
                           remoteUrl:(NSURL *)url
                           cachePath:(NSString * _Nullable)cachePath;

/**
 *  Filesystem path to the downloaded and cached copy of this resource.
 */
- (NSString *)resourceCachePath;
/**
 *  Returns [self resourceCachePath] if a file exists there. Otherwise returns a NSBundle path.
 */
- (NSString *)resourceLocalPathPreferringCache;

/**
 *  Returns true if `CachesDirectory` is a miss, but `NSBundle ... pathForResource` has a hit.
 */
- (BOOL)isLocalPathFromNSBundle;

- (NSError *)_validateResponseData:(NSData *)data response:(NSURLResponse *)response;
- (NSError *)_validateErrorData:(NSError *)error response:(NSURLResponse *)response;

/**
 *  Returns whether a cache was removed.
 */
- (BOOL)removeCache;

@end

NS_ASSUME_NONNULL_END
