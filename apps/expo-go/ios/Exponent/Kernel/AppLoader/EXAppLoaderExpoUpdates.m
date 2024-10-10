// Copyright 2020-present 650 Industries. All rights reserved.

#import "EXAppFetcher.h"
#import "EXAppLoaderExpoUpdates.h"
#import "EXClientReleaseType.h"
#import "EXEnvironment.h"
#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"
#import "EXManifestResource.h"
#import "EXSession.h"
#import "EXUpdatesDatabaseManager.h"
#import "EXVersions.h"

#import "Expo_Go-Swift.h"

#import <React/RCTUtils.h>
#import <sys/utsname.h>

@import EXManifests;
@import EXUpdates;

NS_ASSUME_NONNULL_BEGIN

@interface EXAppLoaderExpoUpdates ()

@property (nonatomic, strong, nullable) NSURL *manifestUrl;
@property (nonatomic, strong, nullable) NSURL *httpManifestUrl;

@property (nonatomic, strong, nullable) EXManifestsManifest *confirmedManifest;
@property (nonatomic, strong, nullable) EXManifestsManifest *optimisticManifest;
@property (nonatomic, strong, nullable) NSData *bundle;
@property (nonatomic, assign) EXAppLoaderRemoteUpdateStatus remoteUpdateStatus;
@property (nonatomic, assign) BOOL shouldShowRemoteUpdateStatus;
@property (nonatomic, assign) BOOL isUpToDate;

/**
 * Stateful variable to let us prevent multiple simultaneous fetches from the development server.
 * This can happen when reloading a bundle with remote debugging enabled;
 * RN requests the bundle multiple times for some reason.
 */
@property (nonatomic, assign) BOOL isLoadingDevelopmentJavaScriptResource;

@property (nonatomic, strong, nullable) NSError *error;

@property (nonatomic, assign) BOOL shouldUseCacheOnly;

@property (nonatomic, strong) dispatch_queue_t appLoaderQueue;

@property (nonatomic, nullable) EXUpdatesConfig *config;
@property (nonatomic, nullable) EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, nullable) id<EXUpdatesAppLauncher> appLauncher;

@property (nonatomic, nullable) NSDate *startupStartTime;
@property (nonatomic, nullable) NSDate *startupEndTime;

@end

/**
 * Entry point to expo-updates in Expo Go and legacy standalone builds. Fulfills many of the
 * purposes of EXUpdatesAppController along with serving as an interface to the rest of the ExpoKit
 * kernel.
 *
 * Dynamically generates a configuration object with the correct scope key, and then, like
 * EXUpdatesAppController, delegates to an instance of EXUpdatesAppLoaderTask to start the process
 * of loading and launching an update, and responds appropriately depending on the callbacks that
 * are invoked.
 *
 * Multiple instances of EXAppLoaderExpoUpdates can exist at a time; instances are retained by
 * EXKernelAppRegistry (through EXKernelAppRecord).
 */
@implementation EXAppLoaderExpoUpdates

@synthesize manifestUrl = _manifestUrl;
@synthesize bundle = _bundle;
@synthesize remoteUpdateStatus = _remoteUpdateStatus;
@synthesize shouldShowRemoteUpdateStatus = _shouldShowRemoteUpdateStatus;
@synthesize config = _config;
@synthesize selectionPolicy = _selectionPolicy;
@synthesize appLauncher = _appLauncher;
@synthesize isUpToDate = _isUpToDate;

- (instancetype)initWithManifestUrl:(NSURL *)url
{
  if (self = [super init]) {
    _manifestUrl = url;
    _httpManifestUrl = [EXAppLoaderExpoUpdates _httpUrlFromManifestUrl:_manifestUrl];
    _appLoaderQueue = dispatch_queue_create("host.exp.exponent.LoaderQueue", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

#pragma mark - getters and lifecycle

- (void)_reset
{
  _confirmedManifest = nil;
  _optimisticManifest = nil;
  _bundle = nil;
  _config = nil;
  _selectionPolicy = nil;
  _appLauncher = nil;
  _error = nil;
  _shouldUseCacheOnly = NO;
  _remoteUpdateStatus = kEXAppLoaderRemoteUpdateStatusChecking;
  _shouldShowRemoteUpdateStatus = YES;
  _isUpToDate = NO;
  _isLoadingDevelopmentJavaScriptResource = NO;
  _startupStartTime = nil;
  _startupEndTime = nil;
}

- (EXAppLoaderStatus)status
{
  if (_error) {
    return kEXAppLoaderStatusError;
  } else if (_bundle) {
    return kEXAppLoaderStatusHasManifestAndBundle;
  } else if (_optimisticManifest) {
    return kEXAppLoaderStatusHasManifest;
  }
  return kEXAppLoaderStatusNew;
}

- (nullable EXManifestsManifest *)manifest
{
  if (_confirmedManifest) {
    return _confirmedManifest;
  }
  if (_optimisticManifest) {
    return _optimisticManifest;
  }
  return nil;
}

- (nullable NSData *)bundle
{
  if (_bundle) {
    return _bundle;
  }
  return nil;
}

- (void)forceBundleReload
{
  if (self.status == kEXAppLoaderStatusNew) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Tried to load a bundle from an AppLoader with no manifest."
                                 userInfo:@{}];
  }
  NSAssert([self supportsBundleReload], @"Tried to force a bundle reload on a non-development bundle");
  if (self.isLoadingDevelopmentJavaScriptResource) {
    // prevent multiple simultaneous fetches from the development server.
    // this can happen when reloading a bundle with remote debugging enabled;
    // RN requests the bundle multiple times for some reason.
    // TODO: fix inside of RN
    return;
  }
  [self _loadDevelopmentJavaScriptResource];
}

- (BOOL)supportsBundleReload
{
  if (_optimisticManifest) {
    return _optimisticManifest.isUsingDeveloperTool;
  }
  return NO;
}

#pragma mark - public

- (void)request
{
  [self _reset];
  if (_manifestUrl) {
    [self _beginRequest];
  }
}

- (void)requestFromCache
{
  [self _reset];
  _shouldUseCacheOnly = YES;
  if (_manifestUrl) {
    [self _beginRequest];
  }
}

- (nullable NSNumber *)launchDuration
{
  if (!_startupStartTime || !_startupEndTime) {
    return nil;
  }

  return @([_startupEndTime timeIntervalSinceDate:_startupStartTime] * 1000);
}

#pragma mark - EXUpdatesAppLoaderTaskDelegate

- (BOOL)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(EXUpdatesUpdate *)update
{
  [self _setShouldShowRemoteUpdateStatus:update.manifest];
  // if cached manifest was dev mode, or a previous run of this app failed due to a loading error, we want to make sure to check for remote updates
  if (update.manifest.isUsingDeveloperTool || [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager scopeKeyIsRecoveringFromError:update.manifest.scopeKey]) {
    return NO;
  }
  return YES;
}

- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(nullable EXUpdatesUpdate *)update
{
  // expo-cli does not always respect our SDK version headers and respond with a compatible update or an error
  // so we need to check the compatibility here
  EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:_httpManifestUrl originalUrl:_manifestUrl];
  NSError *manifestCompatibilityError = [manifestResource verifyManifestSdkVersion:update.manifest];
  if (manifestCompatibilityError) {
    _error = manifestCompatibilityError;
    if (self.delegate) {
      [self.delegate appLoader:self didFailWithError:_error];
      return;
    }
  }

  _remoteUpdateStatus = kEXAppLoaderRemoteUpdateStatusDownloading;
  [self _setShouldShowRemoteUpdateStatus:update.manifest];
  EXManifestsManifest *processedManifest = [self _processManifest:update.manifest];
  if (processedManifest == nil) {
    return;
  }
  [self _setOptimisticManifest:processedManifest];
}

- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<EXUpdatesAppLauncher>)launcher isUpToDate:(BOOL)isUpToDate
{
  if (_error) {
    return;
  }

  _startupEndTime = [NSDate now];

  if (!_optimisticManifest) {
    EXManifestsManifest *processedManifest = [self _processManifest:launcher.launchedUpdate.manifest];
    if (processedManifest == nil) {
      return;
    }
    [self _setOptimisticManifest:processedManifest];
  }
  _isUpToDate = isUpToDate;
  if (launcher.launchedUpdate.manifest.isUsingDeveloperTool) {
    // in dev mode, we need to set an optimistic manifest but nothing else
    return;
  }
  _confirmedManifest = [self _processManifest:launcher.launchedUpdate.manifest];
  if (_confirmedManifest == nil) {
    return;
  }
  _bundle = [NSData dataWithContentsOfURL:launcher.launchAssetUrl];
  _appLauncher = launcher;
  if (self.delegate) {
    [self.delegate appLoader:self didFinishLoadingManifest:_confirmedManifest bundle:_bundle];
  }
}

- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error
{
  if (!_error) {
    _error = error;
    _startupEndTime = [NSDate now];

    // if the error payload conforms to the error protocol, we can parse it and display
    // a slightly nicer error message to the user
    id errorJson = [NSJSONSerialization JSONObjectWithData:[error.localizedDescription dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:nil];
    if (errorJson && [errorJson isKindOfClass:[NSDictionary class]]) {
      EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:_httpManifestUrl originalUrl:_manifestUrl];
      _error = [manifestResource formatError:[NSError errorWithDomain:EXNetworkErrorDomain code:error.code userInfo:errorJson]];
    }

    if (self.delegate) {
      [self.delegate appLoader:self didFailWithError:_error];
    }
  }
}

- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(EXUpdatesBackgroundUpdateStatus)status update:(nullable EXUpdatesUpdate *)update error:(nullable NSError *)error
{
  if (self.delegate) {
    [self.delegate appLoader:self didResolveUpdatedBundleWithManifest:update.manifest isFromCache:(status == EXUpdatesBackgroundUpdateStatusNoUpdateAvailable) error:error];
  }
}

- (void)appLoaderTaskDidFinishAllLoading:(EXUpdatesAppLoaderTask *)appLoaderTask {}

#pragma mark - internal

+ (NSURL *)_httpUrlFromManifestUrl:(NSURL *)url
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:YES];
  // if scheme is exps or https, use https. Else default to http
  if (components.scheme && ([components.scheme isEqualToString:@"exps"] || [components.scheme isEqualToString:@"https"])){
    components.scheme = @"https";
  } else {
    components.scheme = @"http";
  }
  NSMutableString *path = [((components.path) ? components.path : @"") mutableCopy];
  path = [[EXKernelLinkingManager stringByRemovingDeepLink:path] mutableCopy];
  components.path = path;
  return [components URL];
}

- (BOOL)_initializeDatabase
{
  EXUpdatesDatabaseManager *updatesDatabaseManager = [EXKernel sharedInstance].serviceRegistry.updatesDatabaseManager;
  BOOL success = updatesDatabaseManager.isDatabaseOpen;
  if (!updatesDatabaseManager.isDatabaseOpen) {
    success = [updatesDatabaseManager openDatabase];
  }

  if (!success) {
    _error = updatesDatabaseManager.error;
    if (self.delegate) {
      [self.delegate appLoader:self didFailWithError:_error];
    }
    return NO;
  } else {
    return YES;
  }
}

- (void)_beginRequest
{
  _startupStartTime = [NSDate now];
  if (![self _initializeDatabase]) {
    return;
  }
  [self _startLoaderTask];
}

- (void)_startLoaderTask
{
  BOOL shouldCheckOnLaunch;
  NSNumber *launchWaitMs;
  if (_shouldUseCacheOnly) {
    shouldCheckOnLaunch = NO;
    launchWaitMs = @(0);
  } else {
    shouldCheckOnLaunch = YES;
    launchWaitMs = @(60000);
  }

  NSURL *httpManifestUrl = [[self class] _httpUrlFromManifestUrl:_manifestUrl];

  NSMutableDictionary *updatesConfig = [[NSMutableDictionary alloc] initWithDictionary:@{
    EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: httpManifestUrl.absoluteString,
    EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: httpManifestUrl.absoluteString,
    EXUpdatesConfig.EXUpdatesConfigHasEmbeddedUpdateKey: @NO,
    EXUpdatesConfig.EXUpdatesConfigEnabledKey: @YES,
    EXUpdatesConfig.EXUpdatesConfigLaunchWaitMsKey: launchWaitMs,
    EXUpdatesConfig.EXUpdatesConfigCheckOnLaunchKey: shouldCheckOnLaunch ? EXUpdatesConfig.EXUpdatesConfigCheckOnLaunchValueAlways : EXUpdatesConfig.EXUpdatesConfigCheckOnLaunchValueNever,
    EXUpdatesConfig.EXUpdatesConfigRequestHeadersKey: [self _requestHeaders],
    EXUpdatesConfig.EXUpdatesConfigRuntimeVersionKey: [NSString stringWithFormat:@"exposdk:%@", [EXVersions sharedInstance].sdkVersion],
  }];

  // in Expo Go, embed the Expo Root Certificate and get the Expo Go intermediate certificate and development certificates
  // from the multipart manifest response part

  NSString *expoRootCertPath = [[NSBundle mainBundle] pathForResource:@"expo-root" ofType:@"pem"];
  if (!expoRootCertPath) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"No expo-root certificate found in bundle"
                                 userInfo:@{}];
  }

  NSError *error;
  NSString *expoRootCert = [NSString stringWithContentsOfFile:expoRootCertPath encoding:NSUTF8StringEncoding error:&error];
  if (error) {
    expoRootCert = nil;
  }
  if (!expoRootCert) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Error reading expo-root certificate from bundle"
                                 userInfo:@{ @"underlyingError": error.localizedDescription }];
  }

  updatesConfig[EXUpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey] = expoRootCert;
  updatesConfig[EXUpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey] = @{
    @"keyid": @"expo-root",
    @"alg": @"rsa-v1_5-sha256",
  };
  updatesConfig[EXUpdatesConfig.EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey] = @YES;
  updatesConfig[EXUpdatesConfig.EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey] = @YES;

  // in Expo Go, ignore directives in manifest responses and require a manifest. the current directives
  // (no update available, roll back) don't have any practical use outside of standalone apps
  updatesConfig[EXUpdatesConfig.EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityModeKey] = @YES;

  NSError *configError;
  _config = [EXUpdatesConfig configFromDictionary:updatesConfig error:&configError];
  if (configError) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Error creating updates config"
                                 userInfo:@{ @"underlyingError": configError.localizedDescription }];
  }

  EXUpdatesDatabaseManager *updatesDatabaseManager = [EXKernel sharedInstance].serviceRegistry.updatesDatabaseManager;

  NSArray *sdkVersions = @[
    [EXVersions sharedInstance].sdkVersion,
    [NSString stringWithFormat:@"exposdk:%@", [EXVersions sharedInstance].sdkVersion],
    @"UNVERSIONED",
    @"exposdk:UNVERSIONED"
  ];
  _selectionPolicy = [[EXUpdatesSelectionPolicy alloc]
                      initWithLauncherSelectionPolicy:[[EXExpoGoLauncherSelectionPolicyFilterAware alloc] initWithSdkVersions:sdkVersions]
                      loaderSelectionPolicy:[EXUpdatesLoaderSelectionPolicyFilterAware new]
                      reaperSelectionPolicy:[EXUpdatesReaperSelectionPolicyDevelopmentClient new]];

  EXUpdatesAppLoaderTask *loaderTask = [[EXUpdatesAppLoaderTask alloc] initWithConfig:_config
                                                                             database:updatesDatabaseManager.database
                                                                            directory:updatesDatabaseManager.updatesDirectory
                                                                      selectionPolicy:_selectionPolicy
                                                                        delegateQueue:_appLoaderQueue];
  loaderTask.delegate = self;
  [loaderTask start];
}

- (void)_runReaper
{
  if (_appLauncher.launchedUpdate) {
    EXUpdatesDatabaseManager *updatesDatabaseManager = [EXKernel sharedInstance].serviceRegistry.updatesDatabaseManager;
    [EXUpdatesReaper reapUnusedUpdatesWithConfig:_config
                                        database:updatesDatabaseManager.database
                                       directory:updatesDatabaseManager.updatesDirectory
                                 selectionPolicy:_selectionPolicy
                                  launchedUpdate:_appLauncher.launchedUpdate];
  }
}

- (void)_setOptimisticManifest:(EXManifestsManifest *)manifest
{
  _optimisticManifest = manifest;
  if (self.delegate) {
    [self.delegate appLoader:self didLoadOptimisticManifest:_optimisticManifest];
  }
}

- (void)_setShouldShowRemoteUpdateStatus:(EXManifestsManifest *)manifest
{
  // we don't want to show the cached experience alert when Updates.reloadAsync() is called
  if (_shouldUseCacheOnly) {
    _shouldShowRemoteUpdateStatus = NO;
    return;
  }

  if (manifest) {
    if (manifest.isDevelopmentSilentLaunch) {
      _shouldShowRemoteUpdateStatus = NO;
      return;
    }
  }
  _shouldShowRemoteUpdateStatus = YES;
}

- (void)_loadDevelopmentJavaScriptResource
{
  _isLoadingDevelopmentJavaScriptResource = YES;
  EXAppFetcher *appFetcher = [[EXAppFetcher alloc] initWithAppLoader:self];
  [appFetcher fetchJSBundleWithManifest:self.optimisticManifest cacheBehavior:EXCachedResourceNoCache timeoutInterval:kEXJSBundleTimeout progress:^(EXLoadingProgress *progress) {
    if (self.delegate) {
      [self.delegate appLoader:self didLoadBundleWithProgress:progress];
    }
  } success:^(NSData *bundle) {
    self.isUpToDate = YES;
    self.bundle = bundle;
    self.isLoadingDevelopmentJavaScriptResource = NO;
    if (self.delegate) {
      [self.delegate appLoader:self didFinishLoadingManifest:self.optimisticManifest bundle:self.bundle];
    }
  } error:^(NSError *error) {
    self.error = error;
    self.isLoadingDevelopmentJavaScriptResource = NO;
    if (self.delegate) {
      [self.delegate appLoader:self didFailWithError:error];
    }
  }];
}

# pragma mark - manifest processing

- (nullable EXManifestsManifest *)_processManifest:(EXManifestsManifest *)manifest
{
  @try {
    NSMutableDictionary *mutableManifest = [manifest.rawManifestJSON mutableCopy];

    // set verified to false by default
    if (!mutableManifest[@"isVerified"]) {
      mutableManifest[@"isVerified"] = @(NO);
    }

    // if the app bypassed verification or the manifest is scoped to a random anonymous
    // scope key, automatically verify it
    if (![mutableManifest[@"isVerified"] boolValue] && [EXAppLoaderExpoUpdates _isAnonymousExperience:manifest]) {
      mutableManifest[@"isVerified"] = @(YES);
    }

    // when the manifest is not verified at this point, make the scope key a salted and hashed version of the claimed scope key
    if (![mutableManifest[@"isVerified"] boolValue]) {
      NSString *currentScopeKeyAndSaltToHash = [NSString stringWithFormat:@"unverified-%@", manifest.scopeKey];
      NSString *currentScopeKeyHash = [currentScopeKeyAndSaltToHash hexEncodedSHA256];
      NSString *newScopeKey = [NSString stringWithFormat:@"%@-%@", currentScopeKeyAndSaltToHash, currentScopeKeyHash];
      if ([manifest isKindOfClass:EXManifestsExpoUpdatesManifest.class]) {
        NSDictionary *extra = mutableManifest[@"extra"] ?: @{};
        NSMutableDictionary *mutableExtra = [extra mutableCopy];
        mutableExtra[@"scopeKey"] = newScopeKey;
        mutableManifest[@"extra"] = mutableExtra;
      } else {
        mutableManifest[@"scopeKey"] = newScopeKey;
        mutableManifest[@"id"] = newScopeKey;
      }
    }

    return [EXManifestsManifestFactory manifestForManifestJSON:[mutableManifest copy]];
  }
  @catch (NSException *exception) {
    // Catch parsing errors related to invalid or unexpected manifest properties. For example, if a manifest
    // is missing the `id` property, it'll raise an exception which we want to forward to the user so they
    // can adjust their manifest JSON accordingly.
    _error = [NSError errorWithDomain:@"ExpoParsingManifest"
                                             code:1025
                                         userInfo:@{NSLocalizedDescriptionKey: [@"Failed to parse manifest JSON: " stringByAppendingString:exception.reason] }];
    if (self.delegate) {
      [self.delegate appLoader:self didFailWithError:_error];
    }
  }
  return nil;
}

+ (BOOL)_isAnonymousExperience:(EXManifestsManifest *)manifest
{
  return [manifest.scopeKey hasPrefix:@"@anonymous/"];
}

#pragma mark - headers

- (NSDictionary *)_requestHeaders
{
  NSDictionary *requestHeaders = @{
      @"Exponent-SDK-Version": [self _sdkVersions],
      @"Exponent-Accept-Signature": @"true",
      @"Exponent-Platform": @"ios",
      @"Exponent-Version": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"],
      @"Expo-Client-Environment": [self _clientEnvironment],
      @"Expo-Updates-Environment": [self _clientEnvironment],
      @"User-Agent": [self _userAgentString],
      @"Expo-Client-Release-Type": [EXClientReleaseType clientReleaseType]
  };

  NSString *sessionSecret = [[EXSession sharedInstance] sessionSecret];
  if (sessionSecret) {
    NSMutableDictionary *requestHeadersMutable = [requestHeaders mutableCopy];
    requestHeadersMutable[@"Expo-Session"] = sessionSecret;
    requestHeaders = requestHeadersMutable;
  }

  return requestHeaders;
}

- (NSString *)_userAgentString
{
  struct utsname systemInfo;
  uname(&systemInfo);
  NSString *deviceModel = [NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding];
  return [NSString stringWithFormat:@"Exponent/%@ (%@; %@ %@; Scale/%.2f; %@)",
          [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"],
          deviceModel,
          [UIDevice currentDevice].systemName,
          [UIDevice currentDevice].systemVersion,
          [UIScreen mainScreen].scale,
          [NSLocale autoupdatingCurrentLocale].localeIdentifier];
}

- (NSString *)_clientEnvironment
{
  return @"EXPO_DEVICE";
#if TARGET_IPHONE_SIMULATOR
  return @"EXPO_SIMULATOR";
#endif
}

- (NSString *)_sdkVersions
{
  return [EXVersions sharedInstance].sdkVersion;
}

@end

NS_ASSUME_NONNULL_END
