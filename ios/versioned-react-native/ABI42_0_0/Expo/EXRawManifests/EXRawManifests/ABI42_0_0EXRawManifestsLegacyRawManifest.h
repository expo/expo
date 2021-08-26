//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXRawManifests/ABI42_0_0EXRawManifestsRawManifest.h>
#import <ABI42_0_0EXRawManifests/ABI42_0_0EXRawManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXRawManifestsLegacyRawManifest : ABI42_0_0EXRawManifestsBaseLegacyRawManifest<ABI42_0_0EXRawManifestsRawManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
