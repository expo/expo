//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXRawManifests/ABI41_0_0EXUpdatesRawManifest.h>
#import <ABI41_0_0EXRawManifests/ABI41_0_0EXUpdatesBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesLegacyRawManifest : ABI41_0_0EXUpdatesBaseLegacyRawManifest<ABI41_0_0EXUpdatesRawManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
