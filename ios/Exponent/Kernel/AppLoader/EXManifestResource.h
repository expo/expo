// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCachedResource.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXManifestResource : EXCachedResource

- (instancetype)initWithResourceName:(NSString *)resourceName
                        resourceType:(NSString *)resourceType
                           remoteUrl:(NSURL *)url
                           cachePath:(NSString * _Nullable)cachePath NS_UNAVAILABLE;

/**
 *  @param manifestUrl the actual http url from which to download the manifest
 *  @param originalUrl whatever url the user originally requested
 */
- (instancetype)initWithManifestUrl:(NSURL *)url
                        originalUrl:(NSURL * _Nullable)originalUrl NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
