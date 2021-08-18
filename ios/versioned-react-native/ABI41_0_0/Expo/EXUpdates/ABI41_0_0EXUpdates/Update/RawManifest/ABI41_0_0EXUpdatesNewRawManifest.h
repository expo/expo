//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesRawManifest.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesNewRawManifest : ABI41_0_0EXUpdatesBaseRawManifest<ABI41_0_0EXUpdatesRawManifestBehavior>

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
