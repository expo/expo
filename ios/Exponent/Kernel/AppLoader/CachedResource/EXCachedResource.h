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

// TODO: delete this when we no longer support SDK's with legacy paths (ie) 27, 29
@property (nonatomic, strong) NSArray *legacyResourceCachePaths;

- (instancetype)initWithResourceName:(NSString *)resourceName
                        resourceType:(NSString *)resourceType
                           remoteUrl:(NSURL *)url
                           cachePath:(NSString * _Nullable)cachePath;

/**
 *  Filesystem path to the downloaded and cached copy of this resource.
 */
- (NSString *)resourceCachePath;
/**
 *  NSBundle path to the embedded copy of this resource.
 */
- (NSString *)resourceBundlePath;
/**
 *  Indicates whether or not local copies of this resource are loaded from the NSBundle
 *  rather than the cache.
 */
- (BOOL)isUsingEmbeddedResource;

- (NSError *)_validateResponseData:(NSData *)data response:(NSURLResponse *)response;
- (NSError *)_validateErrorData:(NSError *)error response:(NSURLResponse *)response;

/**
 *  Returns whether a cache was removed.
 */
- (BOOL)removeCache;

@end

NS_ASSUME_NONNULL_END
