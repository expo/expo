//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXUpdatesLegacyUpdate : NSObject

+ (ABI40_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(NSDictionary *)manifest
                                       config:(ABI40_0_0EXUpdatesConfig *)config
                                     database:(ABI40_0_0EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(NSDictionary *)manifest config:(ABI40_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
