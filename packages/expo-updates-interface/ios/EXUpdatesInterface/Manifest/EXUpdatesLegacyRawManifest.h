//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdatesInterface/EXUpdatesRawManifest.h>
#import <EXUpdatesInterface/EXUpdatesBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesLegacyRawManifest : EXUpdatesBaseLegacyRawManifest<EXUpdatesRawManifestBehavior>

- (NSString *)releaseID;
- (NSString *)commitTime;
- (nullable NSArray *)bundledAssets;
- (nullable id)runtimeVersion;
- (nullable NSString *)bundleKey;
- (nullable NSString *)assetUrlOverride;

@end

NS_ASSUME_NONNULL_END
