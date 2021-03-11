//  Copyright © 2019 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXUpdatesCheckAutomaticallyConfig) {
  EXUpdatesCheckAutomaticallyConfigAlways = 0,
  EXUpdatesCheckAutomaticallyConfigWifiOnly = 1,
  EXUpdatesCheckAutomaticallyConfigNever = 2
};

@interface EXUpdatesConfig : NSObject

@property (nonatomic, readonly) BOOL isEnabled;
@property (nonatomic, readonly) BOOL expectsSignedManifest;
@property (nonatomic, readonly) NSString *scopeKey;
@property (nonatomic, readonly) NSURL *updateUrl;
@property (nonatomic, readonly) NSDictionary *requestHeaders;
@property (nonatomic, readonly) NSString *releaseChannel;
@property (nonatomic, readonly) NSNumber *launchWaitMs;
@property (nonatomic, readonly) EXUpdatesCheckAutomaticallyConfig checkOnLaunch;

@property (nullable, nonatomic, readonly) NSString *sdkVersion;
@property (nullable, nonatomic, readonly) NSString *runtimeVersion;
@property (nonatomic, readonly) BOOL isMissingRuntimeVersion;

@property (nonatomic, readonly) BOOL hasEmbeddedUpdate;

+ (instancetype)configWithDictionary:(NSDictionary *)config;
- (void)loadConfigFromDictionary:(NSDictionary *)config;

+ (NSString *)normalizedURLOrigin:(NSURL *)url;

@end

NS_ASSUME_NONNULL_END
