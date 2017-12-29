// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTImageLoader.h>

#import "EXScopedBridgeModule.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXCachedResourceManagerScopedModuleDelegate

- (id)createCachedResourceWithName:(NSString *)resourceName
                      resourceType:(NSString *)resourceType
                         remoteUrl:(NSURL *)url
                         cachePath:(NSString * _Nullable)cachePath;
@end

@interface EXBundleImageLoader : EXScopedBridgeModule <RCTImageURLLoader>

@end

NS_ASSUME_NONNULL_END
