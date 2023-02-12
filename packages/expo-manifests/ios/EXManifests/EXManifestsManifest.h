//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXManifestsManifestBehavior <NSObject>

# pragma mark - Raw JSON

- (NSDictionary *)rawManifestJSON;

# pragma mark - Field getters

/**
 * A best-effort immutable legacy ID for this experience. Stable through project transfers.
 * Should be used for calling Expo and EAS APIs during their transition to easProjectId.
 */
- (NSString *)stableLegacyId DEPRECATED_MSG_ATTRIBUTE("Prefer scopeKey or easProjectId depending on use case.");

/**
 * A stable immutable scoping key for this experience. Should be used for scoping data on the
 * client for this project when running in Expo Go.
 */
- (NSString *)scopeKey;

/**
 * A stable UUID for this EAS project. Should be used to call EAS APIs.
 */
- (nullable NSString *)easProjectId;

/**
 * The legacy ID of this experience.
 * - For Bare manifests, formatted as a UUID.
 * - For Legacy manifests, formatted as @owner/slug. Not stable through project transfers.
 * - For New manifests, currently incorrect value is UUID.
 *
 * Use this in cases where an identifier of the current manifest is needed (experience loading for example).
 * Use scopeKey for cases where a stable key is needed to scope data to this experience.
 * Use easProjectId for cases where a stable UUID identifier of the experience is needed to identify over EAS APIs.
 * Use stableLegacyId for cases where a stable legacy format identifier of the experience is needed (experience scoping for example).
 */
- (NSString *)legacyId;

- (nullable NSString *)sdkVersion;
- (NSString *)bundleUrl;
- (nullable NSString *)revisionId;
- (nullable NSString *)slug;
- (nullable NSString *)appKey;
- (nullable NSString *)name;
- (nullable NSString *)version;
- (nullable NSDictionary *)notificationPreferences;
- (nullable NSDictionary *)updatesInfo;
- (nullable NSDictionary *)iosConfig;
- (nullable NSString *)hostUri;
- (nullable NSString *)orientation;
- (nullable NSDictionary *)experiments;
- (nullable NSDictionary *)developer;
- (nullable NSString *)logUrl;
- (nullable NSString *)facebookAppId;
- (nullable NSString *)facebookApplicationName;
- (BOOL)facebookAutoInitEnabled;
- (NSString *)jsEngine;

# pragma mark - Derived Methods

- (BOOL)isDevelopmentMode;
- (BOOL)isDevelopmentSilentLaunch;
- (BOOL)isUsingDeveloperTool;
- (nullable NSString *)userInterfaceStyle;
- (nullable NSString *)iosOrRootBackgroundColor;
- (nullable NSString *)iosSplashBackgroundColor;
- (nullable NSString *)iosSplashImageUrl;
- (nullable NSString *)iosSplashImageResizeMode;
- (nullable NSString *)iosGoogleServicesFile;

# pragma mark - helper methods

- (nullable NSDictionary *)expoGoConfigRootObject;
- (nullable NSDictionary *)expoClientConfigRootObject;

@end

typedef NSObject<EXManifestsManifestBehavior> EXManifestsManifest;

NS_ASSUME_NONNULL_END
