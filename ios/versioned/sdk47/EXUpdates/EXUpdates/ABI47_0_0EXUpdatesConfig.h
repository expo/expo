//  Copyright © 2019 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class ABI47_0_0EXUpdatesCodeSigningConfiguration;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI47_0_0EXUpdatesCheckAutomaticallyConfig) {
  ABI47_0_0EXUpdatesCheckAutomaticallyConfigAlways = 0,
  ABI47_0_0EXUpdatesCheckAutomaticallyConfigWifiOnly = 1,
  ABI47_0_0EXUpdatesCheckAutomaticallyConfigNever = 2,
  ABI47_0_0EXUpdatesCheckAutomaticallyConfigErrorRecoveryOnly = 3
};

FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigPlistName;

FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigEnableAutoSetupKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigEnabledKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigScopeKeyKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigUpdateUrlKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigRequestHeadersKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigReleaseChannelKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigLaunchWaitMsKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigCheckOnLaunchKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigSDKVersionKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigRuntimeVersionKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigHasEmbeddedUpdateKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigExpectsSignedManifestKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigCodeSigningCertificateKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigCodeSigningMetadataKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey;

FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigCheckOnLaunchValueAlways;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigCheckOnLaunchValueWifiOnly;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigCheckOnLaunchValueErrorRecoveryOnly;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXUpdatesConfigCheckOnLaunchValueNever;


@interface ABI47_0_0EXUpdatesConfig : NSObject

@property (nonatomic, readonly) BOOL isEnabled;
@property (nonatomic, readonly) BOOL expectsSignedManifest;
@property (nonatomic, readonly) NSString *scopeKey;
@property (nonatomic, readonly) NSURL *updateUrl;
@property (nonatomic, readonly) NSDictionary *requestHeaders;
@property (nonatomic, readonly) NSString *releaseChannel;
@property (nonatomic, readonly) NSNumber *launchWaitMs;
@property (nonatomic, readonly) ABI47_0_0EXUpdatesCheckAutomaticallyConfig checkOnLaunch;
@property (nonatomic, readonly, strong, nullable) ABI47_0_0EXUpdatesCodeSigningConfiguration *codeSigningConfiguration;

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
