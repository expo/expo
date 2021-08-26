//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsRawManifest.h>
#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXRawManifestsLegacyRawManifest : ABI40_0_0EXRawManifestsBaseLegacyRawManifest<ABI40_0_0EXRawManifestsRawManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
