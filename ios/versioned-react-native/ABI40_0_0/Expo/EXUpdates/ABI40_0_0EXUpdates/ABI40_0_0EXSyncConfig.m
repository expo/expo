//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXSyncConfig ()

@property (nonatomic, readwrite, assign) BOOL isEnabled;
@property (nonatomic, readwrite, strong) NSString *scopeKey;
@property (nonatomic, readwrite, strong) NSURL *updateUrl;
@property (nonatomic, readwrite, strong) NSDictionary *requestHeaders;
@property (nonatomic, readwrite, strong) NSString *releaseChannel;
@property (nonatomic, readwrite, strong) NSNumber *launchWaitMs;
@property (nonatomic, readwrite, assign) ABI40_0_0EXSyncCheckAutomaticallyConfig checkOnLaunch;

@property (nullable, nonatomic, readwrite, strong) NSString *sdkVersion;
@property (nullable, nonatomic, readwrite, strong) NSString *runtimeVersion;

@end

static NSString * const ABI40_0_0EXSyncDefaultReleaseChannelName = @"default";

static NSString * const ABI40_0_0EXSyncConfigEnabledKey = @"ABI40_0_0EXSyncEnabled";
static NSString * const ABI40_0_0EXSyncConfigScopeKeyKey = @"ABI40_0_0EXSyncScopeKey";
static NSString * const ABI40_0_0EXSyncConfigManifestUrlKey = @"ABI40_0_0EXSyncURL";
static NSString * const ABI40_0_0EXSyncConfigRequestHeadersKey = @"ABI40_0_0EXSyncRequestHeaders";
static NSString * const ABI40_0_0EXSyncConfigReleaseChannelKey = @"ABI40_0_0EXSyncReleaseChannel";
static NSString * const ABI40_0_0EXSyncConfigLaunchWaitMsKey = @"ABI40_0_0EXSyncLaunchWaitMs";
static NSString * const ABI40_0_0EXSyncConfigCheckOnLaunchKey = @"ABI40_0_0EXSyncCheckOnLaunch";
static NSString * const ABI40_0_0EXSyncConfigSDKVersionKey = @"ABI40_0_0EXSyncSDKVersion";
static NSString * const ABI40_0_0EXSyncConfigRuntimeVersionKey = @"ABI40_0_0EXSyncRuntimeVersion";
static NSString * const ABI40_0_0EXSyncConfigUsesLegacyManifestKey = @"ABI40_0_0EXSyncUsesLegacyManifest";
static NSString * const ABI40_0_0EXSyncConfigHasEmbeddedManifestKey = @"ABI40_0_0EXSyncHasEmbeddedManifest";

static NSString * const ABI40_0_0EXSyncConfigAlwaysString = @"ALWAYS";
static NSString * const ABI40_0_0EXSyncConfigWifiOnlyString = @"WIFI_ONLY";
static NSString * const ABI40_0_0EXSyncConfigNeverString = @"NEVER";

@implementation ABI40_0_0EXSyncConfig

- (instancetype)init
{
  if (self = [super init]) {
    _isEnabled = YES;
    _requestHeaders = @{};
    _releaseChannel = ABI40_0_0EXSyncDefaultReleaseChannelName;
    _launchWaitMs = @(0);
    _checkOnLaunch = ABI40_0_0EXSyncCheckAutomaticallyConfigAlways;
    _usesLegacyManifest = YES;
    _hasEmbeddedUpdate = YES;
  }
  return self;
}

+ (instancetype)configWithDictionary:(NSDictionary *)config
{
  ABI40_0_0EXSyncConfig *updatesConfig = [[ABI40_0_0EXSyncConfig alloc] init];
  [updatesConfig loadConfigFromDictionary:config];
  return updatesConfig;
}

- (void)loadConfigFromDictionary:(NSDictionary *)config
{
  id isEnabled = config[ABI40_0_0EXSyncConfigEnabledKey];
  if (isEnabled && [isEnabled isKindOfClass:[NSNumber class]]) {
    _isEnabled = [(NSNumber *)isEnabled boolValue];
  }

  id updateUrl = config[ABI40_0_0EXSyncConfigManifestUrlKey];
  if (updateUrl && [updateUrl isKindOfClass:[NSString class]]) {
    NSURL *url = [NSURL URLWithString:(NSString *)updateUrl];
    _updateUrl = url;
  }

  id scopeKey = config[ABI40_0_0EXSyncConfigScopeKeyKey];
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

  id requestHeaders = config[ABI40_0_0EXSyncConfigRequestHeadersKey];
  if (requestHeaders && [requestHeaders isKindOfClass:[NSDictionary class]]) {
    _requestHeaders = (NSDictionary *)requestHeaders;
  }

  id releaseChannel = config[ABI40_0_0EXSyncConfigReleaseChannelKey];
  if (releaseChannel && [releaseChannel isKindOfClass:[NSString class]]) {
    _releaseChannel = (NSString *)releaseChannel;
  }

  id launchWaitMs = config[ABI40_0_0EXSyncConfigLaunchWaitMsKey];
  if (launchWaitMs && [launchWaitMs isKindOfClass:[NSNumber class]]) {
    _launchWaitMs = (NSNumber *)launchWaitMs;
  } else if (launchWaitMs && [launchWaitMs isKindOfClass:[NSString class]]) {
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.numberStyle = NSNumberFormatterNoStyle;
    _launchWaitMs = [formatter numberFromString:(NSString *)launchWaitMs];
  }

  id checkOnLaunch = config[ABI40_0_0EXSyncConfigCheckOnLaunchKey];
  if (checkOnLaunch && [checkOnLaunch isKindOfClass:[NSString class]]) {
    if ([ABI40_0_0EXSyncConfigNeverString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = ABI40_0_0EXSyncCheckAutomaticallyConfigNever;
    } else if ([ABI40_0_0EXSyncConfigWifiOnlyString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = ABI40_0_0EXSyncCheckAutomaticallyConfigWifiOnly;
    } else if ([ABI40_0_0EXSyncConfigAlwaysString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = ABI40_0_0EXSyncCheckAutomaticallyConfigAlways;
    }
  }

  id sdkVersion = config[ABI40_0_0EXSyncConfigSDKVersionKey];
  if (sdkVersion && [sdkVersion isKindOfClass:[NSString class]]) {
    _sdkVersion = (NSString *)sdkVersion;
  }

  id runtimeVersion = config[ABI40_0_0EXSyncConfigRuntimeVersionKey];
  if (runtimeVersion && [runtimeVersion isKindOfClass:[NSString class]]) {
    _runtimeVersion = (NSString *)runtimeVersion;
  }

  NSAssert(_sdkVersion || _runtimeVersion, @"One of ABI40_0_0EXSyncSDKVersion or ABI40_0_0EXSyncRuntimeVersion must be configured in expo-updates");
  
  id usesLegacyManifest = config[ABI40_0_0EXSyncConfigUsesLegacyManifestKey];
  if (usesLegacyManifest && [usesLegacyManifest isKindOfClass:[NSNumber class]]) {
    _usesLegacyManifest = [(NSNumber *)usesLegacyManifest boolValue];
  }

  id hasEmbeddedUpdate = config[ABI40_0_0EXSyncConfigHasEmbeddedManifestKey];
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
