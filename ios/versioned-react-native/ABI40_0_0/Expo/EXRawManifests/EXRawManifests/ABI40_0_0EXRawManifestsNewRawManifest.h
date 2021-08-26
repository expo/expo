//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsRawManifest.h>
#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXRawManifestsNewRawManifest : ABI40_0_0EXRawManifestsBaseRawManifest<ABI40_0_0EXRawManifestsRawManifestBehavior>

/**
 * An ID representing this manifest, not the ID for the experience.
 */
- (NSString *)rawId;

/**
 * Incorrect for now until we figure out how to get this in the new manifest format.
 */
- (NSString *)stableLegacyId DEPRECATED_MSG_ATTRIBUTE("Modern manifests don't support stable legacy IDs");

- (NSString *)scopeKey;
- (nullable NSString *)projectId;

- (NSString *)createdAt;
- (NSString *)runtimeVersion;
- (NSDictionary *)launchAsset;
- (nullable NSArray *)assets;

- (nullable NSDictionary *)expoGoConfigRootObject;
- (nullable NSDictionary *)expoClientConfigRootObject;

@end

NS_ASSUME_NONNULL_END
