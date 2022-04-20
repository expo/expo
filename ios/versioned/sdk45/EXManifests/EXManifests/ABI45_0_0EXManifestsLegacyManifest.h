//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsManifest.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsBaseLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXManifestsLegacyManifest : ABI45_0_0EXManifestsBaseLegacyManifest<ABI45_0_0EXManifestsManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
