// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCachedResource.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXJavaScriptResource : EXCachedResource

- (instancetype)initWithResourceName:(NSString *)resourceName
                        resourceType:(NSString *)resourceType
                           remoteUrl:(NSURL *)url
                           cachePath:(NSString * _Nullable)cachePath NS_UNAVAILABLE;

- (instancetype)initWithBundleName:(NSString *)bundleName
                         remoteUrl:(NSURL *)url
                   devToolsEnabled:(BOOL)devToolsEnabled NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
