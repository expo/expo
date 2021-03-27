//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncLegacyManifest : NSObject

+ (EXSyncManifest *)updateWithLegacyManifest:(NSDictionary *)manifest
                                       config:(EXSyncConfig *)config
                                     database:(EXSyncDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(NSDictionary *)manifest config:(EXSyncConfig *)config;

@end

NS_ASSUME_NONNULL_END
