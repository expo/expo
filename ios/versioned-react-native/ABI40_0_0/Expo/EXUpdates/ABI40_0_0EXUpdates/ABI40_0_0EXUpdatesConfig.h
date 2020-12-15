//  Copyright © 2019 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI40_0_0EXUpdatesCheckAutomaticallyConfig) {
  ABI40_0_0EXUpdatesCheckAutomaticallyConfigAlways = 0,
  ABI40_0_0EXUpdatesCheckAutomaticallyConfigWifiOnly = 1,
  ABI40_0_0EXUpdatesCheckAutomaticallyConfigNever = 2
};

@interface ABI40_0_0EXUpdatesConfig : NSObject

@property (nonatomic, readonly) BOOL isEnabled;
@property (nonatomic, readonly) NSString *scopeKey;
@property (nonatomic, readonly) NSURL *updateUrl;
@property (nonatomic, readonly) NSDictionary *requestHeaders;
@property (nonatomic, readonly) NSString *releaseChannel;
@property (nonatomic, readonly) NSNumber *launchWaitMs;
@property (nonatomic, readonly) ABI40_0_0EXUpdatesCheckAutomaticallyConfig checkOnLaunch;

@property (nullable, nonatomic, readonly) NSString *sdkVersion;
@property (nullable, nonatomic, readonly) NSString *runtimeVersion;

@property (nonatomic, readonly) BOOL usesLegacyManifest;
@property (nonatomic, readonly) BOOL hasEmbeddedUpdate;

+ (instancetype)configWithDictionary:(NSDictionary *)config;
- (void)loadConfigFromDictionary:(NSDictionary *)config;

+ (NSString *)normalizedURLOrigin:(NSURL *)url;

@end

NS_ASSUME_NONNULL_END
