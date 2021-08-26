//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>
#import <EXManifests/EXManifestsLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesLegacyUpdate : NSObject

+ (EXUpdatesUpdate *)updateWithLegacyManifest:(EXManifestsLegacyRawManifest *)manifest
                                       config:(EXUpdatesConfig *)config
                                     database:(EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(EXManifestsLegacyRawManifest *)manifest config:(EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
