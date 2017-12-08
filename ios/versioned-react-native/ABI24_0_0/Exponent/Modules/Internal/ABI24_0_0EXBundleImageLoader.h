// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI24_0_0/ABI24_0_0RCTImageLoader.h>

#import "ABI24_0_0EXScopedBridgeModule.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ABI24_0_0EXCachedResourceManagerScopedModuleDelegate

- (id)createCachedResourceWithName:(NSString *)resourceName
                      resourceType:(NSString *)resourceType
                         remoteUrl:(NSURL *)url
                         cachePath:(NSString * _Nullable)cachePath;
@end

@interface ABI24_0_0EXBundleImageLoader : ABI24_0_0EXScopedBridgeModule <ABI24_0_0RCTImageURLLoader>

@end

NS_ASSUME_NONNULL_END
