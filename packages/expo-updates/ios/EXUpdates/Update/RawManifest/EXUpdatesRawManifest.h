//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXUpdatesRawManifestBehavior <NSObject>

# pragma mark - Raw JSON

- (NSDictionary *)rawManifestJSON;

# pragma mark - Field getters

- (nullable NSString *)rawID;
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
