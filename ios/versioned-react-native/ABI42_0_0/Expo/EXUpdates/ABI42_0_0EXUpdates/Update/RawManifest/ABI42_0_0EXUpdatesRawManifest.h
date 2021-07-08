//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXUpdatesRawManifestBehavior <NSObject>

# pragma mark - Raw JSON

- (NSDictionary *)rawManifestJSON;

# pragma mark - Field getters

/**
 * A best-effort immutable legacy ID for this experience. Formatted the same as legacyId.
 * Stable through project transfers.
 */
- (NSString *)stableLegacyId;

/**
 * A stable immutable scoping key for this experience. Should be used for scoping data that
 * does not need to make calls externally with the legacy ID.
 */
- (NSString *)scopeKey;

/**
 * A stable UUID for this EAS project. Should be used to call EAS APIs where possible.
 */
- (nullable NSString *)projectId;

/**
 * The legacy ID of this experience.
 * - For Bare manifests, formatted as a UUID.
 * - For Legacy manifests, formatted as @owner/slug. Not stable through project transfers.
 * - For New manifests, currently incorrect value is UUID.
 *
 * Use this in cases where an identifier of the current manifest is needed (experience loading for example).
 * Use scopeKey for cases where a stable key is needed to scope data to this experience.
 * Use projectId for cases where a stable UUID identifier of the experience is needed to identify over APIs.
 * Use stableLegacyId for cases where a stable legacy format identifier of the experience is needed (experience scoping for example).
 */
- (NSString *)legacyId;

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
- (nullable NSString *)facebookAppId;
- (nullable NSString *)facebookApplicationName;
- (BOOL)facebookAutoInitEnabled;

# pragma mark - Derived Methods

- (BOOL)isDevelopmentMode;
- (BOOL)isDevelopmentSilentLaunch;
- (BOOL)isUsingDeveloperTool;
- (nullable NSString *)userInterfaceStyle;
- (nullable NSString *)androidOrRootBackroundColor;
- (nullable NSString *)iosSplashBackgroundColor;
- (nullable NSString *)iosSplashImageUrl;
- (nullable NSString *)iosSplashImageResizeMode;
- (nullable NSString *)iosGoogleServicesFile;

@end

typedef NSObject<ABI42_0_0EXUpdatesRawManifestBehavior> ABI42_0_0EXUpdatesRawManifest;

NS_ASSUME_NONNULL_END
