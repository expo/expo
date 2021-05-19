//  Copyright © 2021 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

@protocol EXUpdatesRawManifestBehavior <NSObject>

# pragma mark - Raw JSON

- (NSDictionary *)rawManifestJSON;

# pragma mark - Field getters

/**
 * A best-effort immutable legacy ID for this experience. Formatted the same as getLegacyID.
 * Stable through project transfers.
 */
- (nullable NSString *)stableLegacyId;

/**
 * The legacy ID of this experience.
 * - For Bare manifests, formatted as a UUID.
 * - For Legacy manifests, formatted as @owner/slug. Not stable through project transfers.
 * - For New manifests, currently incorrect value is UUID.
 *
 * Use this in cases where an identifier of the current manifest is needed (experience loading for example).
 * Prefer getStableLegacyID for cases where a stable identifier of the experience is needed (experience scoping for example).
 */
- (nullable NSString *)legacyId;

- (nullable NSString *)sdkVersion;
- (NSString *)bundleUrl;
- (nullable NSString *)revisionId;
- (nullable NSString *)slug;
- (nullable NSString *)appKey;
- (nullable NSString *)name;
- (nullable NSDictionary *)notificationPreferences;
- (nullable NSDictionary *)updatesInfo;
- (nullable NSDictionary *)iosConfig;
- (nullable NSString *)hostUri;
- (nullable NSString *)orientation;
- (nullable NSDictionary *)experiments;
- (nullable NSDictionary *)developer;

# pragma mark - Derived Methods

- (BOOL)isDevelopmentMode;
- (BOOL)isDevelopmentSilentLaunch;
- (BOOL)isUsingDeveloperTool;
- (nullable NSString *)userInterfaceStyle;
- (nullable NSString *)androidOrRootBackroundColor;
- (nullable NSString *)iosSplashBackgroundColor;
- (nullable NSString *)iosSplashImageUrl;
- (nullable NSString *)iosSplashImageResizeMode;

@end

typedef NSObject<EXUpdatesRawManifestBehavior> EXUpdatesRawManifest;

NS_ASSUME_NONNULL_END
