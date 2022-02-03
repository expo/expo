//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>
#import <EXManifests/EXManifestsLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesLegacyUpdate : NSObject

+ (EXUpdatesUpdate *)updateWithLegacyManifest:(EXManifestsLegacyManifest *)manifest
                                       config:(EXUpdatesConfig *)config
                                     database:(EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(EXManifestsLegacyManifest *)manifest config:(EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
