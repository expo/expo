//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesUpdate.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXUpdatesLegacyUpdate : NSObject

+ (ABI45_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI45_0_0EXManifestsLegacyManifest *)manifest
                                       config:(ABI45_0_0EXUpdatesConfig *)config
                                     database:(ABI45_0_0EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI45_0_0EXManifestsLegacyManifest *)manifest config:(ABI45_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
