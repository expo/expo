//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsManifest.h>
#import <EXManifests/EXManifestsBaseLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXManifestsLegacyManifest : EXManifestsBaseLegacyManifest<EXManifestsManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
