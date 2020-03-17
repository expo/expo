//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesConfig ()

@property (nonatomic, readwrite, assign) BOOL isEnabled;
@property (nonatomic, readwrite, strong) NSURL *updateUrl;
@property (nonatomic, readwrite, strong) NSString *releaseChannel;
@property (nonatomic, readwrite, strong) NSNumber *launchWaitMs;
@property (nonatomic, readwrite, assign) EXUpdatesCheckAutomaticallyConfig checkOnLaunch;

@property (nullable, nonatomic, readwrite, strong) NSString *sdkVersion;
@property (nullable, nonatomic, readwrite, strong) NSString *runtimeVersion;

@end

static NSString * const kEXUpdatesConfigPlistName = @"Expo";
static NSString * const kEXUpdatesDefaultReleaseChannelName = @"default";

static NSString * const kEXUpdatesConfigEnabledKey = @"EXUpdatesEnabled";
static NSString * const kEXUpdatesConfigUpdateUrlKey = @"EXUpdatesURL";
static NSString * const kEXUpdatesConfigReleaseChannelKey = @"EXUpdatesReleaseChannel";
static NSString * const kEXUpdatesConfigLaunchWaitMsKey = @"EXUpdatesLaunchWaitMs";
static NSString * const kEXUpdatesConfigCheckOnLaunchKey = @"EXUpdatesCheckOnLaunch";
static NSString * const kEXUpdatesConfigSDKVersionKey = @"EXUpdatesSDKVersion";
static NSString * const kEXUpdatesConfigRuntimeVersionKey = @"EXUpdatesRuntimeVersion";
static NSString * const kEXUpdatesConfigUsesLegacyManifestKey = @"EXUpdatesUsesLegacyManifest";

static NSString * const kEXUpdatesConfigAlwaysString = @"ALWAYS";
static NSString * const kEXUpdatesConfigWifiOnlyString = @"WIFI_ONLY";
static NSString * const kEXUpdatesConfigNeverString = @"NEVER";

@implementation EXUpdatesConfig

+ (instancetype)sharedInstance
{
  static EXUpdatesConfig *theConfig;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theConfig) {
      theConfig = [[EXUpdatesConfig alloc] init];
    }
  });
  return theConfig;
}

- (instancetype)init
{
  if (self = [super init]) {
    _isEnabled = YES;
    _releaseChannel = kEXUpdatesDefaultReleaseChannelName;
    _launchWaitMs = @(0);
    _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigAlways;
    _usesLegacyManifest = YES;
    [self _loadConfigFromExpoPlist];
  }
  return self;
}

- (void)_loadConfigFromExpoPlist
{
  NSString *configPath = [[NSBundle mainBundle] pathForResource:kEXUpdatesConfigPlistName ofType:@"plist"];
  if (configPath) {
    [self loadConfigFromDictionary:[NSDictionary dictionaryWithContentsOfFile:configPath]];
  }
}

- (void)loadConfigFromDictionary:(NSDictionary *)config
{
  id isEnabled = config[kEXUpdatesConfigEnabledKey];
  if (isEnabled && [isEnabled isKindOfClass:[NSNumber class]]) {
    _isEnabled = [(NSNumber *)isEnabled boolValue];
  }

  id updateUrl = config[kEXUpdatesConfigUpdateUrlKey];
  if (updateUrl && [updateUrl isKindOfClass:[NSString class]]) {
    NSURL *url = [NSURL URLWithString:(NSString *)updateUrl];
    NSAssert(url, @"EXUpdatesURL must be a valid URL");
    _updateUrl = url;
  }

  id releaseChannel = config[kEXUpdatesConfigReleaseChannelKey];
  if (releaseChannel && [releaseChannel isKindOfClass:[NSString class]]) {
    _releaseChannel = (NSString *)releaseChannel;
  }

  id launchWaitMs = config[kEXUpdatesConfigLaunchWaitMsKey];
  if (launchWaitMs && [launchWaitMs isKindOfClass:[NSNumber class]]) {
    _launchWaitMs = (NSNumber *)launchWaitMs;
  } else if (launchWaitMs && [launchWaitMs isKindOfClass:[NSString class]]) {
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.numberStyle = NSNumberFormatterNoStyle;
    _launchWaitMs = [formatter numberFromString:(NSString *)launchWaitMs];
  }

  id checkOnLaunch = config[kEXUpdatesConfigCheckOnLaunchKey];
  if (checkOnLaunch && [checkOnLaunch isKindOfClass:[NSString class]]) {
    if ([kEXUpdatesConfigNeverString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigNever;
    } else if ([kEXUpdatesConfigWifiOnlyString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigWifiOnly;
    } else if ([kEXUpdatesConfigAlwaysString isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigAlways;
    }
  }

  id sdkVersion = config[kEXUpdatesConfigSDKVersionKey];
  if (sdkVersion && [sdkVersion isKindOfClass:[NSString class]]) {
    _sdkVersion = (NSString *)sdkVersion;
  }

  id runtimeVersion = config[kEXUpdatesConfigRuntimeVersionKey];
  if (runtimeVersion && [runtimeVersion isKindOfClass:[NSString class]]) {
    _runtimeVersion = (NSString *)runtimeVersion;
  }

  NSAssert(_sdkVersion || _runtimeVersion, @"One of EXUpdatesSDKVersion or EXUpdatesRuntimeVersion must be configured in expo-updates");
  
  id usesLegacyManifest = config[kEXUpdatesConfigUsesLegacyManifestKey];
  if (usesLegacyManifest && [usesLegacyManifest isKindOfClass:[NSNumber class]]) {
    _usesLegacyManifest = [(NSNumber *)usesLegacyManifest boolValue];
  }
}

@end

NS_ASSUME_NONNULL_END
