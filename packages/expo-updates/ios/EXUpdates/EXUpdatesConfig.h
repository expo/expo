//  Copyright © 2019 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXUpdatesCodeSigningConfiguration;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXUpdatesCheckAutomaticallyConfig) {
  EXUpdatesCheckAutomaticallyConfigAlways = 0,
  EXUpdatesCheckAutomaticallyConfigWifiOnly = 1,
  EXUpdatesCheckAutomaticallyConfigNever = 2,
  EXUpdatesCheckAutomaticallyConfigErrorRecoveryOnly = 3
};

FOUNDATION_EXPORT NSString * const EXUpdatesConfigPlistName;

FOUNDATION_EXPORT NSString * const EXUpdatesConfigEnableAutoSetupKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigEnabledKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigScopeKeyKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigUpdateUrlKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigRequestHeadersKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigReleaseChannelKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigLaunchWaitMsKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigCheckOnLaunchKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigSDKVersionKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigRuntimeVersionKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigHasEmbeddedUpdateKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigExpectsSignedManifestKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigCodeSigningCertificateKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigCodeSigningMetadataKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey;

FOUNDATION_EXPORT NSString * const EXUpdatesConfigCheckOnLaunchValueAlways;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigCheckOnLaunchValueWifiOnly;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigCheckOnLaunchValueErrorRecoveryOnly;
FOUNDATION_EXPORT NSString * const EXUpdatesConfigCheckOnLaunchValueNever;


@interface EXUpdatesConfig : NSObject

@property (nonatomic, readonly) BOOL isEnabled;
@property (nonatomic, readonly) BOOL expectsSignedManifest;
@property (nonatomic, readonly) NSString *scopeKey;
@property (nonatomic, readonly) NSURL *updateUrl;
@property (nonatomic, readonly) NSDictionary *requestHeaders;
@property (nonatomic, readonly) NSString *releaseChannel;
@property (nonatomic, readonly) NSNumber *launchWaitMs;
@property (nonatomic, readonly) EXUpdatesCheckAutomaticallyConfig checkOnLaunch;
@property (nonatomic, readonly, strong, nullable) EXUpdatesCodeSigningConfiguration *codeSigningConfiguration;

@property (nullable, nonatomic, readonly) NSString *sdkVersion;
@property (nullable, nonatomic, readonly) NSString *runtimeVersion;
@property (nonatomic, readonly) BOOL isMissingRuntimeVersion;

@property (nonatomic, readonly) BOOL hasEmbeddedUpdate;

+ (instancetype)configWithExpoPlist;
+ (instancetype)configWithDictionary:(NSDictionary *)config;
- (void)loadConfigFromDictionary:(NSDictionary *)config;

+ (NSString *)normalizedURLOrigin:(NSURL *)url;

@end

NS_ASSUME_NONNULL_END
