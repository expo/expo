//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsManifest.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsBaseLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXManifestsLegacyManifest : ABI42_0_0EXManifestsBaseLegacyManifest<ABI42_0_0EXManifestsManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
