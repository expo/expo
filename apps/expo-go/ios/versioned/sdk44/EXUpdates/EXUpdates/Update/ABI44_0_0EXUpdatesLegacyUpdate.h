//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesLegacyUpdate : NSObject

+ (ABI44_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI44_0_0EXManifestsLegacyManifest *)manifest
                                       config:(ABI44_0_0EXUpdatesConfig *)config
                                     database:(ABI44_0_0EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI44_0_0EXManifestsLegacyManifest *)manifest config:(ABI44_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
