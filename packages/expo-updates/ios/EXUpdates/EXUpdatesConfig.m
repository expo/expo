//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesConfig ()

@property (nonatomic, readwrite, strong) NSURL *updateUrl;
@property (nonatomic, readwrite, strong) NSString *releaseChannel;
@property (nonatomic, readwrite, strong) NSNumber *launchWaitMs;
@property (nonatomic, readwrite, assign) EXUpdatesCheckAutomaticallyConfig checkOnLaunch;

@property (nullable, nonatomic, readwrite, strong) NSString *sdkVersion;
@property (nullable, nonatomic, readwrite, strong) NSString *runtimeVersion;

@end

static NSString * const kEXUpdatesConfigPlistName = @"expo-config";
static NSString * const kEXUpdatesDefaultReleaseChannelName = @"default";

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
    [self _loadConfig];
  }
  return self;
}

- (void)_loadConfig
{
  NSString *configPath = [[NSBundle mainBundle] pathForResource:kEXUpdatesConfigPlistName ofType:@"plist"];
  NSDictionary *config = (configPath) ? [NSDictionary dictionaryWithContentsOfFile:configPath] : @{};

  id updateUrl = config[@"updateUrl"];
  NSAssert(updateUrl && [updateUrl isKindOfClass:[NSString class]], @"updateUrl must be a nonnull string");
  NSURL *url = [NSURL URLWithString:(NSString *)updateUrl];
  NSAssert(url, @"updateUrl must be a valid URL");
  _updateUrl = url;

  id releaseChannel = config[@"releaseChannel"];
  if (releaseChannel && [releaseChannel isKindOfClass:[NSString class]]) {
    _releaseChannel = (NSString *)releaseChannel;
  } else {
    _releaseChannel = kEXUpdatesDefaultReleaseChannelName;
  }

  id launchWaitMs = config[@"launchWaitMs"];
  if (launchWaitMs && [launchWaitMs isKindOfClass:[NSNumber class]]) {
    _launchWaitMs = (NSNumber *)launchWaitMs;
  } else if (launchWaitMs && [launchWaitMs isKindOfClass:[NSString class]]) {
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.numberStyle = NSNumberFormatterNoStyle;
    _launchWaitMs = [formatter numberFromString:(NSString *)launchWaitMs];
  }
  if (!_launchWaitMs) {
    _launchWaitMs = @(0);
  }

  id checkOnLaunch = config[@"checkOnLaunch"];
  if (checkOnLaunch && [checkOnLaunch isKindOfClass:[NSString class]]) {
    if ([@"NEVER" isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigNever;
    } else if ([@"WIFI_ONLY" isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigWifiOnly;
    } else {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigAlways;
    }
  } else {
    _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigAlways;
  }

  id sdkVersion = config[@"sdkVersion"];
  if (sdkVersion && [sdkVersion isKindOfClass:[NSString class]]) {
    _sdkVersion = (NSString *)sdkVersion;
  }

  id runtimeVersion = config[@"runtimeVersion"];
  if (runtimeVersion && [runtimeVersion isKindOfClass:[NSString class]]) {
    _runtimeVersion = (NSString *)runtimeVersion;
  }

  NSAssert(_sdkVersion || _runtimeVersion, @"One of sdkVersion or runtimeVersion must be defined in expo-config.plist");
  
  id usesLegacyManifest = config[@"usesLegacyManifest"];
  if (usesLegacyManifest && [usesLegacyManifest isKindOfClass:[NSNumber class]]) {
    _usesLegacyManifest = [(NSNumber *)usesLegacyManifest boolValue];
  } else {
    _usesLegacyManifest = YES;
  }
}

@end

NS_ASSUME_NONNULL_END
