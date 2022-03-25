//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesAppController.h>

#if __has_include(<EXUpdates/EXUpdatesCodeSigningConfiguration-Swift.h>)
#import <EXUpdates/EXUpdatesCodeSigningConfiguration-Swift.h>
#else
#import "EXUpdates-Swift.h"
#endif

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesConfig ()

@property (nonatomic, readwrite, assign) BOOL isEnabled;
@property (nonatomic, readwrite, assign) BOOL expectsSignedManifest;
@property (nonatomic, readwrite, strong) NSString *scopeKey;
@property (nonatomic, readwrite, strong) NSURL *updateUrl;
@property (nonatomic, readwrite, strong) NSDictionary *requestHeaders;
@property (nonatomic, readwrite, strong) NSString *releaseChannel;
@property (nonatomic, readwrite, strong) NSNumber *launchWaitMs;
@property (nonatomic, readwrite, assign) EXUpdatesCheckAutomaticallyConfig checkOnLaunch;
@property (nonatomic, readwrite, strong, nullable) EXUpdatesCodeSigningConfiguration *codeSigningConfiguration;

@property (nullable, nonatomic, readwrite, strong) NSString *sdkVersion;
@property (nullable, nonatomic, readwrite, strong) NSString *runtimeVersion;

@end

NSString * const EXUpdatesConfigPlistName = @"Expo";

NSString * const EXUpdatesConfigEnableAutoSetupKey = @"EXUpdatesAutoSetup";
NSString * const EXUpdatesConfigEnabledKey = @"EXUpdatesEnabled";
NSString * const EXUpdatesConfigScopeKeyKey = @"EXUpdatesScopeKey";
NSString * const EXUpdatesConfigUpdateUrlKey = @"EXUpdatesURL";
NSString * const EXUpdatesConfigRequestHeadersKey = @"EXUpdatesRequestHeaders";
NSString * const EXUpdatesConfigReleaseChannelKey = @"EXUpdatesReleaseChannel";
NSString * const EXUpdatesConfigLaunchWaitMsKey = @"EXUpdatesLaunchWaitMs";
NSString * const EXUpdatesConfigCheckOnLaunchKey = @"EXUpdatesCheckOnLaunch";
NSString * const EXUpdatesConfigSDKVersionKey = @"EXUpdatesSDKVersion";
NSString * const EXUpdatesConfigRuntimeVersionKey = @"EXUpdatesRuntimeVersion";
NSString * const EXUpdatesConfigHasEmbeddedUpdateKey = @"EXUpdatesHasEmbeddedUpdate";
NSString * const EXUpdatesConfigExpectsSignedManifestKey = @"EXUpdatesExpectsSignedManifest";
NSString * const EXUpdatesConfigCodeSigningCertificateKey = @"EXUpdatesCodeSigningCertificate";
NSString * const EXUpdatesConfigCodeSigningMetadataKey = @"EXUpdatesCodeSigningMetadata";
NSString * const EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey = @"EXUpdatesCodeSigningIncludeManifestResponseCertificateChain";
NSString * const EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey = @"EXUpdatesConfigCodeSigningAllowUnsignedManifests";

NSString * const EXUpdatesConfigReleaseChannelDefaultValue = @"default";

NSString * const EXUpdatesConfigCheckOnLaunchValueAlways = @"ALWAYS";
NSString * const EXUpdatesConfigCheckOnLaunchValueWifiOnly = @"WIFI_ONLY";
NSString * const EXUpdatesConfigCheckOnLaunchValueErrorRecoveryOnly = @"ERROR_RECOVERY_ONLY";
NSString * const EXUpdatesConfigCheckOnLaunchValueNever = @"NEVER";

@implementation EXUpdatesConfig

- (instancetype)init
{
  if (self = [super init]) {
    _isEnabled = YES;
    _expectsSignedManifest = NO;
    _requestHeaders = @{};
    _releaseChannel = EXUpdatesConfigReleaseChannelDefaultValue;
    _launchWaitMs = @(0);
    _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigAlways;
    _hasEmbeddedUpdate = YES;
  }
  return self;
}

+ (instancetype)configWithDictionary:(NSDictionary *)config
{
  EXUpdatesConfig *updatesConfig = [[EXUpdatesConfig alloc] init];
  [updatesConfig loadConfigFromDictionary:config];
  return updatesConfig;
}

+ (instancetype)configWithExpoPlist
{
  NSString *configPath = [[NSBundle mainBundle] pathForResource:EXUpdatesConfigPlistName ofType:@"plist"];
  if (!configPath) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
                                 userInfo:@{}];
  }
  return [[self class] configWithDictionary:[NSDictionary dictionaryWithContentsOfFile:configPath]];
}

- (void)loadConfigFromDictionary:(NSDictionary *)config
{
  id isEnabled = config[EXUpdatesConfigEnabledKey];
  if (isEnabled && [isEnabled isKindOfClass:[NSNumber class]]) {
    _isEnabled = [(NSNumber *)isEnabled boolValue];
  }
  
  id expectsSignedManifest = config[EXUpdatesConfigExpectsSignedManifestKey];
  if (expectsSignedManifest && [expectsSignedManifest isKindOfClass:[NSNumber class]]) {
    _expectsSignedManifest = [(NSNumber *)expectsSignedManifest boolValue];
  }
  
  id updateUrl = config[EXUpdatesConfigUpdateUrlKey];
  if (updateUrl && [updateUrl isKindOfClass:[NSString class]]) {
    NSURL *url = [NSURL URLWithString:(NSString *)updateUrl];
    _updateUrl = url;
  }

  id scopeKey = config[EXUpdatesConfigScopeKeyKey];
  if (scopeKey && [scopeKey isKindOfClass:[NSString class]]) {
    _scopeKey = (NSString *)scopeKey;
  }

  // set updateUrl as the default value if none is provided
  if (!_scopeKey) {
    if (_updateUrl) {
      _scopeKey = [[self class] normalizedURLOrigin:_updateUrl];
    }
  }

  id requestHeaders = config[EXUpdatesConfigRequestHeadersKey];
  if (requestHeaders) {
    if(![requestHeaders isKindOfClass:[NSDictionary class]]){
      @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                     reason:[NSString stringWithFormat:@"Plist key \"%@\" must be a string-valued Dictionary.", EXUpdatesConfigRequestHeadersKey]
                                   userInfo:@{}];
    }
    _requestHeaders = (NSDictionary *)requestHeaders;
    
    for (id key in _requestHeaders){
      if (![_requestHeaders[key] isKindOfClass:[NSString class]]){
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:[NSString stringWithFormat:@"Plist key \"%@\" must be a string-valued Dictionary.", EXUpdatesConfigRequestHeadersKey]
                                     userInfo:@{}];
      }
    }
  }

  id releaseChannel = config[EXUpdatesConfigReleaseChannelKey];
  if (releaseChannel && [releaseChannel isKindOfClass:[NSString class]]) {
    _releaseChannel = (NSString *)releaseChannel;
  }

  id launchWaitMs = config[EXUpdatesConfigLaunchWaitMsKey];
  if (launchWaitMs && [launchWaitMs isKindOfClass:[NSNumber class]]) {
    _launchWaitMs = (NSNumber *)launchWaitMs;
  } else if (launchWaitMs && [launchWaitMs isKindOfClass:[NSString class]]) {
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.numberStyle = NSNumberFormatterNoStyle;
    _launchWaitMs = [formatter numberFromString:(NSString *)launchWaitMs];
  }

  id checkOnLaunch = config[EXUpdatesConfigCheckOnLaunchKey];
  if (checkOnLaunch && [checkOnLaunch isKindOfClass:[NSString class]]) {
    if ([EXUpdatesConfigCheckOnLaunchValueNever isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigNever;
    } else if ([EXUpdatesConfigCheckOnLaunchValueErrorRecoveryOnly isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigErrorRecoveryOnly;
    } else if ([EXUpdatesConfigCheckOnLaunchValueWifiOnly isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigWifiOnly;
    } else if ([EXUpdatesConfigCheckOnLaunchValueAlways isEqualToString:(NSString *)checkOnLaunch]) {
      _checkOnLaunch = EXUpdatesCheckAutomaticallyConfigAlways;
    }
  }

  id sdkVersion = config[EXUpdatesConfigSDKVersionKey];
  if (sdkVersion && [sdkVersion isKindOfClass:[NSString class]]) {
    _sdkVersion = (NSString *)sdkVersion;
  }

  id runtimeVersion = config[EXUpdatesConfigRuntimeVersionKey];
  if (runtimeVersion && [runtimeVersion isKindOfClass:[NSString class]]) {
    _runtimeVersion = (NSString *)runtimeVersion;
  }

  id hasEmbeddedUpdate = config[EXUpdatesConfigHasEmbeddedUpdateKey];
  if (hasEmbeddedUpdate && [hasEmbeddedUpdate isKindOfClass:[NSNumber class]]) {
    _hasEmbeddedUpdate = [(NSNumber *)hasEmbeddedUpdate boolValue];
  }
  
  NSString *codeSigningCertificate;
  id codeSigningCertificateRaw = config[EXUpdatesConfigCodeSigningCertificateKey];
  if (codeSigningCertificateRaw && [codeSigningCertificateRaw isKindOfClass:[NSString class]]) {
    codeSigningCertificate = (NSString *)codeSigningCertificateRaw;
  }
  
  NSDictionary *codeSigningMetadata;
  id codeSigningMetadataRaw = config[EXUpdatesConfigCodeSigningMetadataKey];
  if (codeSigningMetadataRaw) {
    if(![codeSigningMetadataRaw isKindOfClass:[NSDictionary class]]){
      @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                     reason:[NSString stringWithFormat:@"Plist key \"%@\" must be a string-valued Dictionary.", EXUpdatesConfigCodeSigningMetadataKey]
                                   userInfo:@{}];
    }
    codeSigningMetadata = (NSDictionary *)codeSigningMetadataRaw;
    for (id key in codeSigningMetadata){
      if (![codeSigningMetadata[key] isKindOfClass:[NSString class]]){
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:[NSString stringWithFormat:@"Plist key \"%@\" must be a string-valued Dictionary.", EXUpdatesConfigCodeSigningMetadataKey]
                                     userInfo:@{}];
      }
    }
  }
  
  BOOL codeSigningIncludeManifestResponseCertificateChain = NO;
  id codeSigningIncludeManifestResponseCertificateChainRaw = config[EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey];
  if (codeSigningIncludeManifestResponseCertificateChainRaw && [codeSigningIncludeManifestResponseCertificateChainRaw isKindOfClass:[NSNumber class]]) {
    codeSigningIncludeManifestResponseCertificateChain = [(NSNumber *)codeSigningIncludeManifestResponseCertificateChainRaw boolValue];
  }
  
  BOOL codeSigningAllowUnsignedManifests = NO;
  id codeSigningAllowUnsignedManifestsRaw = config[EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey];
  if (codeSigningAllowUnsignedManifestsRaw && [codeSigningAllowUnsignedManifestsRaw isKindOfClass:[NSNumber class]]) {
    codeSigningAllowUnsignedManifests = [(NSNumber *)codeSigningAllowUnsignedManifestsRaw boolValue];
  }
  
  if (codeSigningCertificate) {
    _codeSigningConfiguration = [EXUpdatesConfig codeSigningConfigurationForCodeSigningCertificate:codeSigningCertificate
                                                                               codeSigningMetadata:codeSigningMetadata
                                                codeSigningIncludeManifestResponseCertificateChain:codeSigningIncludeManifestResponseCertificateChain
                                                                 codeSigningAllowUnsignedManifests:codeSigningAllowUnsignedManifests];
  }
}

- (BOOL)isMissingRuntimeVersion
{
  return (!_runtimeVersion || !_runtimeVersion.length) && (!_sdkVersion || !_sdkVersion.length);
}

+ (nullable EXUpdatesCodeSigningConfiguration *)codeSigningConfigurationForCodeSigningCertificate:(NSString *)codeSigningCertificate
                                                                              codeSigningMetadata:(nullable NSDictionary *)codeSigningMetadata
                                               codeSigningIncludeManifestResponseCertificateChain:(BOOL)codeSigningIncludeManifestResponseCertificateChain
                                                                codeSigningAllowUnsignedManifests:(BOOL)codeSigningAllowUnsignedManifests {
  NSError *error;
  EXUpdatesCodeSigningConfiguration *codeSigningConfiguration = [[EXUpdatesCodeSigningConfiguration alloc] initWithEmbeddedCertificateString:codeSigningCertificate
                                                                                                                                    metadata:codeSigningMetadata
                                                                                                     includeManifestResponseCertificateChain:codeSigningIncludeManifestResponseCertificateChain
                                                                                                                      allowUnsignedManifests:codeSigningAllowUnsignedManifests
                                                                                                                                       error:&error];
  if (error) {
    NSString *message = [EXUpdatesCodeSigningErrorUtils messageForError:error.code];
    @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:message userInfo:nil];
  }
  
  return codeSigningConfiguration;
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
