//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsRawManifest.h>
#import <EXManifests/EXManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXManifestsLegacyRawManifest : EXManifestsBaseLegacyRawManifest<EXManifestsRawManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
