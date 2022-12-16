//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesUpdate.h>
#import <ABI46_0_0EXManifests/ABI46_0_0EXManifestsLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXUpdatesLegacyUpdate : NSObject

+ (ABI46_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI46_0_0EXManifestsLegacyManifest *)manifest
                                       config:(ABI46_0_0EXUpdatesConfig *)config
                                     database:(ABI46_0_0EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI46_0_0EXManifestsLegacyManifest *)manifest config:(ABI46_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
