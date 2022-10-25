//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI47_0_0EXJSONUtils/NSDictionary+ABI47_0_0EXJSONUtils.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXManifestsBaseManifest : NSObject

@property (nonatomic, readonly, strong) NSDictionary* rawManifestJSON;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithRawManifestJSON:(NSDictionary *)rawManifestJSON NS_DESIGNATED_INITIALIZER;

# pragma mark - Common ABI47_0_0EXManifestsManifestBehavior

- (NSString *)legacyId;
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

- (BOOL)isDevelopmentMode;
- (BOOL)isDevelopmentSilentLaunch;
- (BOOL)isUsingDeveloperTool;
- (nullable NSString *)userInterfaceStyle;
- (nullable NSString *)iosOrRootBackgroundColor;
- (nullable NSString *)iosSplashBackgroundColor;
- (nullable NSString *)iosSplashImageUrl;
- (nullable NSString *)iosSplashImageResizeMode;
- (nullable NSString *)iosGoogleServicesFile;

- (nullable NSDictionary *)expoGoConfigRootObject;
- (nullable NSDictionary *)expoClientConfigRootObject;

@end

NS_ASSUME_NONNULL_END
