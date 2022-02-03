//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUpdate.h>
#import <ABI43_0_0EXManifests/ABI43_0_0EXManifestsLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXUpdatesLegacyUpdate : NSObject

+ (ABI43_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI43_0_0EXManifestsLegacyManifest *)manifest
                                       config:(ABI43_0_0EXUpdatesConfig *)config
                                     database:(ABI43_0_0EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI43_0_0EXManifestsLegacyManifest *)manifest config:(ABI43_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
