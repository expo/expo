//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>
#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesLegacyUpdate : NSObject

+ (ABI48_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI48_0_0EXManifestsLegacyManifest *)manifest
                                       config:(ABI48_0_0EXUpdatesConfig *)config
                                     database:(ABI48_0_0EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI48_0_0EXManifestsLegacyManifest *)manifest config:(ABI48_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
