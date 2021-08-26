//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXRawManifests/EXRawManifestsRawManifest.h>
#import <EXRawManifests/EXRawManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXRawManifestsLegacyRawManifest : EXRawManifestsBaseLegacyRawManifest<EXRawManifestsRawManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
