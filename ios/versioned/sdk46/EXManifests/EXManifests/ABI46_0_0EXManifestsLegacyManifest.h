//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI46_0_0EXManifests/ABI46_0_0EXManifestsManifest.h>
#import <ABI46_0_0EXManifests/ABI46_0_0EXManifestsBaseLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXManifestsLegacyManifest : ABI46_0_0EXManifestsBaseLegacyManifest<ABI46_0_0EXManifestsManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
