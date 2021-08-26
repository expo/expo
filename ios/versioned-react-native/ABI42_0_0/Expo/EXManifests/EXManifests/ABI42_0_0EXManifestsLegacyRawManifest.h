//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsRawManifest.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXManifestsLegacyRawManifest : ABI42_0_0EXManifestsBaseLegacyRawManifest<ABI42_0_0EXManifestsRawManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
