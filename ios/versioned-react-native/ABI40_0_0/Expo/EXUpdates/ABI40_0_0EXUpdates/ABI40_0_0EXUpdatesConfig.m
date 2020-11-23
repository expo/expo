//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXUpdatesConfig ()

@property (nonatomic, readwrite, assign) BOOL isEnabled;
@property (nonatomic, readwrite, strong) NSString *scopeKey;
@property (nonatomic, readwrite, strong) NSURL *updateUrl;
@property (nonatomic, readwrite, strong) NSDictionary *requestHeaders;
@property (nonatomic, readwrite, strong) NSString *releaseChannel;
@property (nonatomic, readwrite, strong) NSNumber *launchWaitMs;
@property (nonatomic, readwrite, assign) ABI40_0_0EXUpdatesCheckAutomaticallyConfig checkOnLaunch;

@property (nullable, nonatomic, readwrite, strong) NSString *sdkVersion;
@property (nullable, nonatomic, readwrite, strong) NSString *runtimeVersion;

@end

static NSString * const ABI40_0_0EXUpdatesDefaultReleaseChannelName = @"default";

static NSString * const ABI40_0_0EXUpdatesConfigEnabledKey = @"ABI40_0_0EXUpdatesEnabled";
static NSString * const ABI40_0_0EXUpdatesConfigScopeKeyKey = @"ABI40_0_0EXUpdatesScopeKey";
static NSString * const ABI40_0_0EXUpdatesConfigUpdateUrlKey = @"ABI40_0_0EXUpdatesURL";
static NSString * const ABI40_0_0EXUpdatesConfigRequestHeadersKey = @"ABI40_0_0EXUpdatesRequestHeaders";
static NSString * const ABI40_0_0EXUpdatesConfigReleaseChannelKey = @"ABI40_0_0EXUpdatesReleaseChannel";
static NSString * const ABI40_0_0EXUpdatesConfigLaunchWaitMsKey = @"ABI40_0_0EXUpdatesLaunchWaitMs";
static NSString * const ABI40_0_0EXUpdatesConfigCheckOnLaunchKey = @"ABI40_0_0EXUpdatesCheckOnLaunch";
static NSString * const ABI40_0_0EXUpdatesConfigSDKVersionKey = @"ABI40_0_0EXUpdatesSDKVersion";
static NSString * const ABI40_0_0EXUpdatesConfigRuntimeVersionKey = @"ABI40_0_0EXUpdatesRuntimeVersion";
static NSString * const ABI40_0_0EXUpdatesConfigUsesLegacyManifestKey = @"ABI40_0_0EXUpdatesUsesLegacyManifest";
static NSString * const ABI40_0_0EXUpdatesConfigHasEmbeddedUpdateKey = @"ABI40_0_0EXUpdatesHasEmbeddedUpdate";

static NSString * const ABI40_0_0EXUpdatesConfigAlwaysString = @"ALWAYS";
static NSString * const ABI40_0_0EXUpdatesConfigWifiOnlyString = @"WIFI_ONLY";
static NSString * const ABI40_0_0EXUpdatesConfigNeverString = @"NEVER";

@implementation ABI40_0_0EXUpdatesConfig

- (instancetype)init
{
  if (self = [super init]) {
    _isEnabled = YES;
    _requestHeaders = @{};
    _releaseChannel = ABI40_0_0EXUpdatesDefaultReleaseChannelName;
    _launchWaitMs = @(0);
    _checkOnLaunch = ABI40_0_0EXUpdatesCheckAutomaticallyConfigAlways;
    _usesLegacyManifest = YES;
    _hasEmbeddedUpdate = YES;
  }
  return self;
}

+ (instancetype)configWithDictionary:(NSDictionary *)config
{
  ABI40_0_0EXUpdatesConfig *updatesConfig = [[ABI40_0_0EXUpdatesConfig alloc] init];
  [updatesConfig loadConfigFromDictionary:config];
  return updatesConfig;
}

- (void)loadConfigFromDictionary:(NSDictionary *)config
{
  id isEnabled = config[ABI40_0_0EXUpdatesConfigEnabledKey];
  if (isEnabled && [isEnabled isKindOfClass:[NSNumber class]]) {
    _isEnabled = [(NSNumber *)isEnabled boolValue];
  }

  id updateUrl = config[ABI40_0_0EXUpdatesConfigUpdateUrlKey];
  if (updateUrl && [updateUrl isKindOfClass:[NSString class]]) {
    NSURL *url = [NSURL URLWithString:(NSString *)updateUrl];
    _updateUrl = url;
  }

  id scopeKey = config[ABI40_0_0EXUpdatesConfigScopeKeyKey];
  if (scopeKey && [scopeKey isKindOfClass:[NSString class]]) {
    _scopeKey = (NSString *)scopeKey;
  }

  // set updateUrl as the default value if none is provided
  if (!_scopeKey) {
    if (_updateUrl) {
      _scopeKey = [[self class] normalizedURLOrigin:_updateUrl];
    } else {
      @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                     reason:@"expo-updates must be configured with a valid update URL or scope key."
                                   userInfo:@{}];
    }
  }

  id requestHeaders = config[ABI40_0_0EXUpdatesConfigRequestHeadersKey];
  if (requestHeaders && [requestHeaders isKindOfClass:[NSDictionary class]]) {
    _requestHeaders = (NSDictionary *)requestHeaders;
  }

  id releaseChannel = config[ABI40_0_0EXUpdatesConfigReleaseChannelKey];
  if (releaseChannel && [releaseChannel isKindOfClass:[NSString class]]) {
    _releaseChannel = (NSString *)releaseChannel;
  }

  id launchWaitMs = config[ABI40_0_0EXUpdatesConfigLaunchWaitMsKey];
  if (launchWaitMs && [launchWaitMs isKindOfClass:[NSNumber class]]) {
    _launchWaitMs = (NSNumber *)launchWaitMs;
  } else if (launchWaitMs && [launchWaitMs isKindOfClass:[NSString class]]) {
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.numberStyle = NSNumberFormatterNoStyle;
    _launchWaitMs = [formatter numberFromString:(NSString *)launchWaitMs];
  }

  id checkOnLaunch = config[ABI40_0_0EXUpdatesConfigCheckOnLaunchKey];
  if (checkOnLaunch && [checkOnLaunch isKindOfClass:[NSString class]]) {
    if ([ABI40_0_0EXUpdatesConfigNeverString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = ABI40_0_0EXUpdatesCheckAutomaticallyConfigNever;
    } else if ([ABI40_0_0EXUpdatesConfigWifiOnlyString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = ABI40_0_0EXUpdatesCheckAutomaticallyConfigWifiOnly;
    } else if ([ABI40_0_0EXUpdatesConfigAlwaysString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = ABI40_0_0EXUpdatesCheckAutomaticallyConfigAlways;
    }
  }

  id sdkVersion = config[ABI40_0_0EXUpdatesConfigSDKVersionKey];
  if (sdkVersion && [sdkVersion isKindOfClass:[NSString class]]) {
    _sdkVersion = (NSString *)sdkVersion;
  }

  id runtimeVersion = config[ABI40_0_0EXUpdatesConfigRuntimeVersionKey];
  if (runtimeVersion && [runtimeVersion isKindOfClass:[NSString class]]) {
    _runtimeVersion = (NSString *)runtimeVersion;
  }

  NSAssert(_sdkVersion || _runtimeVersion, @"One of ABI40_0_0EXUpdatesSDKVersion or ABI40_0_0EXUpdatesRuntimeVersion must be configured in expo-updates");
  
  id usesLegacyManifest = config[ABI40_0_0EXUpdatesConfigUsesLegacyManifestKey];
  if (usesLegacyManifest && [usesLegacyManifest isKindOfClass:[NSNumber class]]) {
    _usesLegacyManifest = [(NSNumber *)usesLegacyManifest boolValue];
  }

  id hasEmbeddedUpdate = config[ABI40_0_0EXUpdatesConfigHasEmbeddedUpdateKey];
  if (hasEmbeddedUpdate && [hasEmbeddedUpdate isKindOfClass:[NSNumber class]]) {
    _hasEmbeddedUpdate = [(NSNumber *)hasEmbeddedUpdate boolValue];
  }
}

+ (NSString *)normalizedURLOrigin:(NSURL *)url
{
  NSString *scheme = url.scheme;
  NSNumber *port = url.port;
  if (port && port.integerValue > -1 && [port isEqual:[[self class] defaultPortForScheme:scheme]]) {
    port = nil;
  }

  return (port && port.integerValue > -1)
    ? [NSString stringWithFormat:@"%@://%@:%ld", scheme, url.host, (long)port.integerValue]
    : [NSString stringWithFormat:@"%@://%@", scheme, url.host];
}

+ (nullable NSNumber *)defaultPortForScheme:(NSString *)scheme
{
  if ([@"http" isEqualToString:scheme] || [@"ws" isEqualToString:scheme]) {
    return @(80);
  } else if ([@"https" isEqualToString:scheme] || [@"wss" isEqualToString:scheme]) {
    return @(443);
  } else if ([@"ftp" isEqualToString:scheme]) {
    return @(21);
  }
  return nil;
}

@end

NS_ASSUME_NONNULL_END
