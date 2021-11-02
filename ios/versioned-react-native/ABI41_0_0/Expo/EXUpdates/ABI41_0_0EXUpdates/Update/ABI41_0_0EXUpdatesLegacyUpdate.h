//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>
#import <ABI41_0_0EXManifests/ABI41_0_0EXManifestsLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesLegacyUpdate : NSObject

+ (ABI41_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI41_0_0EXManifestsLegacyManifest *)manifest
                                       config:(ABI41_0_0EXUpdatesConfig *)config
                                     database:(ABI41_0_0EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI41_0_0EXManifestsLegacyManifest *)manifest config:(ABI41_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
