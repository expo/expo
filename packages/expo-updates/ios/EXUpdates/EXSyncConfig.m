//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncConfig ()

@property (nonatomic, readwrite, assign) BOOL isEnabled;
@property (nonatomic, readwrite, assign) BOOL expectsSignedManifest;
@property (nonatomic, readwrite, strong) NSString *scopeKey;
@property (nonatomic, readwrite, strong) NSURL *updateUrl;
@property (nonatomic, readwrite, strong) NSDictionary *requestHeaders;
@property (nonatomic, readwrite, strong) NSString *releaseChannel;
@property (nonatomic, readwrite, strong) NSNumber *launchWaitMs;
@property (nonatomic, readwrite, assign) EXSyncCheckAutomaticallyConfig checkOnLaunch;

@property (nullable, nonatomic, readwrite, strong) NSString *sdkVersion;
@property (nullable, nonatomic, readwrite, strong) NSString *runtimeVersion;

@end

static NSString * const EXSyncDefaultReleaseChannelName = @"default";

static NSString * const EXSyncConfigEnabledKey = @"EXSyncEnabled";
static NSString * const EXSyncConfigScopeKeyKey = @"EXSyncScopeKey";
static NSString * const EXSyncConfigManifestUrlKey = @"EXSyncURL";
static NSString * const EXSyncConfigRequestHeadersKey = @"EXSyncRequestHeaders";
static NSString * const EXSyncConfigReleaseChannelKey = @"EXSyncReleaseChannel";
static NSString * const EXSyncConfigLaunchWaitMsKey = @"EXSyncLaunchWaitMs";
static NSString * const EXSyncConfigCheckOnLaunchKey = @"EXSyncCheckOnLaunch";
static NSString * const EXSyncConfigSDKVersionKey = @"EXSyncSDKVersion";
static NSString * const EXSyncConfigRuntimeVersionKey = @"EXSyncRuntimeVersion";
static NSString * const EXSyncConfigUsesLegacyManifestKey = @"EXSyncUsesLegacyManifest";
static NSString * const EXSyncConfigHasEmbeddedManifestKey = @"EXSyncHasEmbeddedManifest";

static NSString * const EXSyncConfigAlwaysString = @"ALWAYS";
static NSString * const EXSyncConfigWifiOnlyString = @"WIFI_ONLY";
static NSString * const EXSyncConfigNeverString = @"NEVER";

@implementation EXSyncConfig

- (instancetype)init
{
  if (self = [super init]) {
    _isEnabled = YES;
    _expectsSignedManifest = NO;
    _requestHeaders = @{};
    _releaseChannel = EXSyncDefaultReleaseChannelName;
    _launchWaitMs = @(0);
    _checkOnLaunch = EXSyncCheckAutomaticallyConfigAlways;
    _usesLegacyManifest = YES;
    _hasEmbeddedUpdate = YES;
  }
  return self;
}

+ (instancetype)configWithDictionary:(NSDictionary *)config
{
  EXSyncConfig *updatesConfig = [[EXSyncConfig alloc] init];
  [updatesConfig loadConfigFromDictionary:config];
  return updatesConfig;
}

- (void)loadConfigFromDictionary:(NSDictionary *)config
{
  id isEnabled = config[EXSyncConfigEnabledKey];
  if (isEnabled && [isEnabled isKindOfClass:[NSNumber class]]) {
    _isEnabled = [(NSNumber *)isEnabled boolValue];
  }
  
  id expectsSignedManifest = config[@"EXSyncExpectsSignedManifest"];
  if (expectsSignedManifest && [expectsSignedManifest isKindOfClass:[NSNumber class]]) {
    _expectsSignedManifest = [(NSNumber *)expectsSignedManifest boolValue];
  }
  
  id updateUrl = config[EXSyncConfigManifestUrlKey];
  if (updateUrl && [updateUrl isKindOfClass:[NSString class]]) {
    NSURL *url = [NSURL URLWithString:(NSString *)updateUrl];
    _updateUrl = url;
  }

  id scopeKey = config[EXSyncConfigScopeKeyKey];
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

  id requestHeaders = config[EXSyncConfigRequestHeadersKey];
  if (requestHeaders && [requestHeaders isKindOfClass:[NSDictionary class]]) {
    _requestHeaders = (NSDictionary *)requestHeaders;
  }

  id releaseChannel = config[EXSyncConfigReleaseChannelKey];
  if (releaseChannel && [releaseChannel isKindOfClass:[NSString class]]) {
    _releaseChannel = (NSString *)releaseChannel;
  }

  id launchWaitMs = config[EXSyncConfigLaunchWaitMsKey];
  if (launchWaitMs && [launchWaitMs isKindOfClass:[NSNumber class]]) {
    _launchWaitMs = (NSNumber *)launchWaitMs;
  } else if (launchWaitMs && [launchWaitMs isKindOfClass:[NSString class]]) {
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.numberStyle = NSNumberFormatterNoStyle;
    _launchWaitMs = [formatter numberFromString:(NSString *)launchWaitMs];
  }

  id checkOnLaunch = config[EXSyncConfigCheckOnLaunchKey];
  if (checkOnLaunch && [checkOnLaunch isKindOfClass:[NSString class]]) {
    if ([EXSyncConfigNeverString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXSyncCheckAutomaticallyConfigNever;
    } else if ([EXSyncConfigWifiOnlyString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXSyncCheckAutomaticallyConfigWifiOnly;
    } else if ([EXSyncConfigAlwaysString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXSyncCheckAutomaticallyConfigAlways;
    }
  }

  id sdkVersion = config[EXSyncConfigSDKVersionKey];
  if (sdkVersion && [sdkVersion isKindOfClass:[NSString class]]) {
    _sdkVersion = (NSString *)sdkVersion;
  }

  id runtimeVersion = config[EXSyncConfigRuntimeVersionKey];
  if (runtimeVersion && [runtimeVersion isKindOfClass:[NSString class]]) {
    _runtimeVersion = (NSString *)runtimeVersion;
  }

  id usesLegacyManifest = config[EXSyncConfigUsesLegacyManifestKey];
  if (usesLegacyManifest && [usesLegacyManifest isKindOfClass:[NSNumber class]]) {
    _usesLegacyManifest = [(NSNumber *)usesLegacyManifest boolValue];
  }

  id hasEmbeddedUpdate = config[EXSyncConfigHasEmbeddedManifestKey];
  if (hasEmbeddedUpdate && [hasEmbeddedUpdate isKindOfClass:[NSNumber class]]) {
    _hasEmbeddedUpdate = [(NSNumber *)hasEmbeddedUpdate boolValue];
  }
}

- (BOOL)isMissingRuntimeVersion
{
  return (!_runtimeVersion || !_runtimeVersion.length) && (!_sdkVersion || !_sdkVersion.length);
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
