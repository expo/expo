//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI47_0_0EXManifests/ABI47_0_0EXManifestsManifest.h>
#import <ABI47_0_0EXManifests/ABI47_0_0EXManifestsBaseManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXManifestsNewManifest : ABI47_0_0EXManifestsBaseManifest<ABI47_0_0EXManifestsManifestBehavior>

/**
 * An ID representing this manifest, not the ID for the experience.
 */
- (NSString *)rawId;

/**
 * Incorrect for now until we figure out how to get this in the new manifest format.
 */
- (NSString *)stableLegacyId DEPRECATED_MSG_ATTRIBUTE("Modern manifests don't support stable legacy IDs");

- (NSString *)scopeKey;
- (nullable NSString *)easProjectId;

- (NSString *)createdAt;
- (NSString *)runtimeVersion;
- (NSDictionary *)launchAsset;
- (nullable NSArray *)assets;

- (nullable NSDictionary *)expoGoConfigRootObject;
- (nullable NSDictionary *)expoClientConfigRootObject;

@end

NS_ASSUME_NONNULL_END
