//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesLegacyUpdate : NSObject

+ (ABI42_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI42_0_0EXManifestsLegacyManifest *)manifest
                                       config:(ABI42_0_0EXUpdatesConfig *)config
                                     database:(ABI42_0_0EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI42_0_0EXManifestsLegacyManifest *)manifest config:(ABI42_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
