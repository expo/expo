//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXSyncLegacyManifest : NSObject

+ (ABI40_0_0EXSyncManifest *)updateWithLegacyManifest:(NSDictionary *)manifest
                                       config:(ABI40_0_0EXSyncConfig *)config
                                     database:(ABI40_0_0EXSyncDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(NSDictionary *)manifest config:(ABI40_0_0EXSyncConfig *)config;

@end

NS_ASSUME_NONNULL_END
