//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI43_0_0EXManifests/ABI43_0_0EXManifestsManifest.h>
#import <ABI43_0_0EXManifests/ABI43_0_0EXManifestsBaseLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXManifestsLegacyManifest : ABI43_0_0EXManifestsBaseLegacyManifest<ABI43_0_0EXManifestsManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
