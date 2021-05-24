//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXUpdatesLegacyUpdate : NSObject

+ (ABI39_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI39_0_0EXUpdatesLegacyRawManifest *)manifest
                                       config:(ABI39_0_0EXUpdatesConfig *)config
                                     database:(ABI39_0_0EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI39_0_0EXUpdatesLegacyRawManifest *)manifest config:(ABI39_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
