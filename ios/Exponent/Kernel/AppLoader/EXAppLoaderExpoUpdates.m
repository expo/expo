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

#import <EXUpdates/EXUpdatesAppLauncherNoDatabase.h>
#import <EXUpdates/EXUpdatesAppLoaderTask.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesReaper.h>
#import <EXUpdates/EXUpdatesSelectionPolicyFactory.h>
#import <EXUpdates/EXUpdatesUtils.h>
#import <React/RCTUtils.h>
#import <sys/utsname.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXAppLoaderExpoUpdates ()

@property (nonatomic, strong, nullable) NSURL *manifestUrl;
@property (nonatomic, strong, nullable) NSURL *httpManifestUrl;

@property (nonatomic, strong, nullable) NSDictionary *confirmedManifest;
@property (nonatomic, strong, nullable) NSDictionary *optimisticManifest;
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
@property (nonatomic, assign) BOOL isEmergencyLaunch;

@end

@implementation EXAppLoaderExpoUpdates

@synthesize manifestUrl = _manifestUrl;
@synthesize bundle = _bundle;
@synthesize remoteUpdateStatus = _remoteUpdateStatus;
@synthesize shouldShowRemoteUpdateStatus = _shouldShowRemoteUpdateStatus;
@synthesize config = _config;
@synthesize selectionPolicy = _selectionPolicy;
@synthesize appLauncher = _appLauncher;
@synthesize isEmergencyLaunch = _isEmergencyLaunch;
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
  _isEmergencyLaunch = NO;
  _remoteUpdateStatus = kEXAppLoaderRemoteUpdateStatusChecking;
  _shouldShowRemoteUpdateStatus = YES;
  _isUpToDate = NO;
  _isLoadingDevelopmentJavaScriptResource = NO;
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

- (nullable NSDictionary *)manifest
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
    return [[self class] areDevToolsEnabledWithManifest:_optimisticManifest];
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

#pragma mark - EXUpdatesAppLoaderTaskDelegate

- (BOOL)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(EXUpdatesUpdate *)update
{
  [self _setShouldShowRemoteUpdateStatus:update.rawManifest];
  // if cached manifest was dev mode, or a previous run of this app failed due to a loading error, we want to make sure to check for remote updates
  if ([[self class] areDevToolsEnabledWithManifest:update.rawManifest] || [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:[EXAppFetcher experienceIdWithManifest:update.rawManifest]]) {
    return NO;
  }
  return YES;
}

- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(EXUpdatesUpdate *)update
{
  // expo-cli does not always respect our SDK version headers and respond with a compatible update or an error
  // so we need to check the compatibility here
  EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:_httpManifestUrl originalUrl:_manifestUrl];
  NSError *manifestCompatibilityError = [manifestResource verifyManifestSdkVersion:update.rawManifest];
  if (manifestCompatibilityError) {
    _error = manifestCompatibilityError;
    if (self.delegate) {
      [self.delegate appLoader:self didFailWithError:_error];
      return;
    }
  }

  _remoteUpdateStatus = kEXAppLoaderRemoteUpdateStatusDownloading;
  [self _setShouldShowRemoteUpdateStatus:update.rawManifest];
  [self _setOptimisticManifest:[self _processManifest:update.rawManifest]];
}

- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<EXUpdatesAppLauncher>)launcher isUpToDate:(BOOL)isUpToDate
{
  if (_error) {
    return;
  }

  if (!_optimisticManifest) {
    [self _setOptimisticManifest:[self _processManifest:launcher.launchedUpdate.rawManifest]];
  }
  _isUpToDate = isUpToDate;
  if ([[self class] areDevToolsEnabledWithManifest:launcher.launchedUpdate.rawManifest]) {
    // in dev mode, we need to set an optimistic manifest but nothing else
    return;
  }
  _confirmedManifest = [self _processManifest:launcher.launchedUpdate.rawManifest];
  _bundle = [NSData dataWithContentsOfURL:launcher.launchAssetUrl];
  _appLauncher = launcher;
  if (self.delegate) {
    [self.delegate appLoader:self didFinishLoadingManifest:_confirmedManifest bundle:_bundle];
  }
}

- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    _isEmergencyLaunch = YES;
    [self _launchWithNoDatabaseAndError:error];
  } else if (!_error) {
    _error = error;

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
    [self.delegate appLoader:self didResolveUpdatedBundleWithManifest:update.rawManifest isFromCache:(status == EXUpdatesBackgroundUpdateStatusNoUpdateAvailable) error:error];
  }
}

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
    if ([EXEnvironment sharedEnvironment].isDetached) {
      shouldCheckOnLaunch = [EXEnvironment sharedEnvironment].updatesCheckAutomatically;
      launchWaitMs = [EXEnvironment sharedEnvironment].updatesFallbackToCacheTimeout;
    } else {
      shouldCheckOnLaunch = YES;
      launchWaitMs = @(60000);
    }
  }

  NSURL *httpManifestUrl = [[self class] _httpUrlFromManifestUrl:_manifestUrl];

  _config = [EXUpdatesConfig configWithDictionary:@{
    @"EXUpdatesURL": httpManifestUrl.absoluteString,
    @"EXUpdatesSDKVersion": [self _sdkVersions],
    @"EXUpdatesScopeKey": httpManifestUrl.absoluteString,
    @"EXUpdatesReleaseChannel": [EXEnvironment sharedEnvironment].releaseChannel,
    @"EXUpdatesHasEmbeddedUpdate": @([EXEnvironment sharedEnvironment].isDetached),
    @"EXUpdatesEnabled": @([EXEnvironment sharedEnvironment].areRemoteUpdatesEnabled),
    @"EXUpdatesLaunchWaitMs": launchWaitMs,
    @"EXUpdatesCheckOnLaunch": shouldCheckOnLaunch ? @"ALWAYS" : @"NEVER",
    @"EXUpdatesExpectsSignedManifest": @YES,
    @"EXUpdatesRequestHeaders": [self _requestHeaders]
  }];

  if (![EXEnvironment sharedEnvironment].areRemoteUpdatesEnabled) {
    [self _launchWithNoDatabaseAndError:nil];
    return;
  }

  EXUpdatesDatabaseManager *updatesDatabaseManager = [EXKernel sharedInstance].serviceRegistry.updatesDatabaseManager;

  NSMutableArray *sdkVersions = [[EXVersions sharedInstance].versions[@"sdkVersions"] ?: @[[EXVersions sharedInstance].temporarySdkVersion] mutableCopy];
  [sdkVersions addObject:@"UNVERSIONED"];
  _selectionPolicy = [EXUpdatesSelectionPolicyFactory filterAwarePolicyWithRuntimeVersions:sdkVersions];

  EXUpdatesAppLoaderTask *loaderTask = [[EXUpdatesAppLoaderTask alloc] initWithConfig:_config
                                                                             database:updatesDatabaseManager.database
                                                                            directory:updatesDatabaseManager.updatesDirectory
                                                                      selectionPolicy:_selectionPolicy
                                                                        delegateQueue:_appLoaderQueue];
  loaderTask.delegate = self;
  [loaderTask start];
}

- (void)_launchWithNoDatabaseAndError:(nullable NSError *)error
{
  EXUpdatesAppLauncherNoDatabase *appLauncher = [[EXUpdatesAppLauncherNoDatabase alloc] init];
  [appLauncher launchUpdateWithConfig:_config fatalError:error];

  _confirmedManifest = [self _processManifest:appLauncher.launchedUpdate.rawManifest];
  _optimisticManifest = _confirmedManifest;
  _bundle = [NSData dataWithContentsOfURL:appLauncher.launchAssetUrl];
  _appLauncher = appLauncher;
  if (self.delegate) {
    [self.delegate appLoader:self didLoadOptimisticManifest:_confirmedManifest];
    [self.delegate appLoader:self didFinishLoadingManifest:_confirmedManifest bundle:_bundle];
  }
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

- (void)_setOptimisticManifest:(NSDictionary *)manifest
{
  _optimisticManifest = manifest;
  if (self.delegate) {
    [self.delegate appLoader:self didLoadOptimisticManifest:_optimisticManifest];
  }
}

- (void)_setShouldShowRemoteUpdateStatus:(NSDictionary *)manifest
{
  // we don't want to show the cached experience alert when Updates.reloadAsync() is called
  if (_shouldUseCacheOnly) {
    _shouldShowRemoteUpdateStatus = NO;
    return;
  }

  if (manifest) {
    NSDictionary *developmentClientSettings = manifest[@"developmentClient"];
    if (developmentClientSettings && [developmentClientSettings isKindOfClass:[NSDictionary class]]) {
      id silentLaunch = developmentClientSettings[@"silentLaunch"];
      if (silentLaunch && [@(YES) isEqual:silentLaunch]) {
        _shouldShowRemoteUpdateStatus = NO;
        return;
      }
    }

    // we want to avoid showing the status for older snack SDK versions, too
    // we make our best guess based on the manifest fields
    // TODO: remove this after SDK 38 is phased out
    NSString *sdkVersion = manifest[@"sdkVersion"];
    NSString *bundleUrl = manifest[@"bundleUrl"];
    if (![@"UNVERSIONED" isEqual:sdkVersion] &&
        sdkVersion.integerValue < 39 &&
        [@"snack" isEqual:manifest[@"slug"]] &&
        bundleUrl && [bundleUrl isKindOfClass:[NSString class]] &&
        [bundleUrl hasPrefix:@"https://d1wp6m56sqw74a.cloudfront.net/%40exponent%2Fsnack"]) {
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

- (NSDictionary *)_processManifest:(NSDictionary *)manifest
{
  NSMutableDictionary *mutableManifest = [manifest mutableCopy];
  if (!mutableManifest[@"isVerified"] && ![EXKernelLinkingManager isExpoHostedUrl:_httpManifestUrl] && !EXEnvironment.sharedEnvironment.isDetached){
    // the manifest id determines the namespace/experience id an app is sandboxed with
    // if manifest is hosted by third parties, we sandbox it with the hostname to avoid clobbering exp.host namespaces
    // for https urls, sandboxed id is of form quinlanj.github.io/myProj-myApp
    // for http urls, sandboxed id is of form UNVERIFIED-quinlanj.github.io/myProj-myApp
    NSString *securityPrefix = [_httpManifestUrl.scheme isEqualToString:@"https"] ? @"" : @"UNVERIFIED-";
    NSString *slugSuffix = manifest[@"slug"] ? [@"-" stringByAppendingString:manifest[@"slug"]]: @"";
    mutableManifest[@"id"] = [NSString stringWithFormat:@"%@%@%@%@", securityPrefix, _httpManifestUrl.host, _httpManifestUrl.path ?: @"", slugSuffix];
    mutableManifest[@"isVerified"] = @(YES);
  }
  if (!mutableManifest[@"isVerified"]) {
    mutableManifest[@"isVerified"] = @(NO);
  }

  if (![mutableManifest[@"isVerified"] boolValue] && (EXEnvironment.sharedEnvironment.isManifestVerificationBypassed || [self _isAnonymousExperience:manifest])) {
    mutableManifest[@"isVerified"] = @(YES);
  }

  return [mutableManifest copy];
}

- (BOOL)_isAnonymousExperience:(NSDictionary *)manifest
{
  NSString *experienceId = manifest[@"id"];
  return experienceId != nil && [experienceId hasPrefix:@"@anonymous/"];
}

+ (BOOL)areDevToolsEnabledWithManifest:(NSDictionary *)manifest
{
  NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
  BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
  return (isDeployedFromTool);
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
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return @"STANDALONE";
  } else {
    return @"EXPO_DEVICE";
#if TARGET_IPHONE_SIMULATOR
    return @"EXPO_SIMULATOR";
#endif
  }
}

- (NSString *)_sdkVersions
{
  NSArray *versionsAvailable = [EXVersions sharedInstance].versions[@"sdkVersions"];
  if (versionsAvailable) {
    return [versionsAvailable componentsJoinedByString:@","];
  } else {
    return [EXVersions sharedInstance].temporarySdkVersion;
  }
}

@end

NS_ASSUME_NONNULL_END
