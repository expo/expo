//  Copyright © 2019 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI43_0_0EXUpdatesCheckAutomaticallyConfig) {
  ABI43_0_0EXUpdatesCheckAutomaticallyConfigAlways = 0,
  ABI43_0_0EXUpdatesCheckAutomaticallyConfigWifiOnly = 1,
  ABI43_0_0EXUpdatesCheckAutomaticallyConfigNever = 2
};

FOUNDATION_EXPORT NSString * const ABI43_0_0EXUpdatesConfigPlistName;
FOUNDATION_EXPORT NSString * const ABI43_0_0EXUpdatesConfigEnableAutoSetupKey;


@interface ABI43_0_0EXUpdatesConfig : NSObject

@property (nonatomic, readonly) BOOL isEnabled;
@property (nonatomic, readonly) BOOL expectsSignedManifest;
@property (nonatomic, readonly) NSString *scopeKey;
@property (nonatomic, readonly) NSURL *updateUrl;
@property (nonatomic, readonly) NSDictionary *requestHeaders;
@property (nonatomic, readonly) NSString *releaseChannel;
@property (nonatomic, readonly) NSNumber *launchWaitMs;
@property (nonatomic, readonly) ABI43_0_0EXUpdatesCheckAutomaticallyConfig checkOnLaunch;

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
