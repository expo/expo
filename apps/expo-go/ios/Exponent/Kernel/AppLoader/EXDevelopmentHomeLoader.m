// Copyright 2020-present 650 Industries. All rights reserved.

#import "EXAppFetcher.h"
#import "EXDevelopmentHomeLoader.h"
#import "EXClientReleaseType.h"
#import "EXEnvironment.h"
#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"
#import "EXManifestResource.h"
#import "EXSession.h"
#import "EXUpdatesDatabaseManager.h"

#import "Expo_Go-Swift.h"

#import <React/RCTUtils.h>
#import <sys/utsname.h>

@import EXManifests;
@import EXUpdates;

NS_ASSUME_NONNULL_BEGIN

@interface EXDevelopmentHomeLoader ()

@property (nonatomic, strong, nullable) EXManifestAndAssetRequestHeaders *manifestAndAssetRequestHeaders;

@property (nonatomic, strong, nullable) EXManifestsManifest *confirmedManifest;
@property (nonatomic, strong, nullable) EXManifestsManifest *optimisticManifest;
@property (nonatomic, strong, nullable) NSData *bundle;
@property (nonatomic, assign) BOOL isUpToDate;

/**
 * Stateful variable to let us prevent multiple simultaneous fetches from the development server.
 * This can happen when reloading a bundle with remote debugging enabled;
 * RN requests the bundle multiple times for some reason.
 */
@property (nonatomic, assign) BOOL isLoadingDevelopmentJavaScriptResource;

@property (nonatomic, strong, nullable) NSError *error;

@property (nonatomic, strong) dispatch_queue_t appLoaderQueue;

@end

@implementation EXDevelopmentHomeLoader

@synthesize bundle = _bundle;
@synthesize isUpToDate = _isUpToDate;

- (instancetype)init {
  if (self = [super init]) {
    _manifestAndAssetRequestHeaders = [EXDevelopmentHomeLoader bundledDevelopmentHomeManifestAndAssetRequestHeaders];
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
  _error = nil;
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
  [self _beginRequest];
}

- (void)requestFromCache
{
  [self request];
}

#pragma mark - EXHomeAppLoaderTaskDelegate

- (void)homeAppLoaderTask:(EXHomeAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<EXUpdatesAppLauncher>)launcher
{
  if (_error) {
    return;
  }

  if (!_optimisticManifest) {
    [self _setOptimisticManifest:launcher.launchedUpdate.manifest];
  }

  // HomeAppLoaderTask always sets this to true
  _isUpToDate = true;

  if (launcher.launchedUpdate.manifest.isUsingDeveloperTool) {
    // in dev mode, we need to set an optimistic manifest but nothing else
    return;
  }
  _confirmedManifest = launcher.launchedUpdate.manifest;
  if (_confirmedManifest == nil) {
    return;
  }
  _bundle = [NSData dataWithContentsOfURL:launcher.launchAssetUrl];

  if (self.delegate) {
    [self.delegate appLoader:self didFinishLoadingManifest:_confirmedManifest bundle:_bundle];
  }
}

- (void)homeAppLoaderTask:(EXHomeAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error
{
  _error = error;

  if (self.delegate) {
    [self.delegate appLoader:self didFailWithError:_error];
  }
}

#pragma mark - internal

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
  NSDictionary *updatesConfig = @{
    EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: @"https://expo.dev", // unused
    EXUpdatesConfig.EXUpdatesConfigHasEmbeddedUpdateKey: @NO,
    EXUpdatesConfig.EXUpdatesConfigRuntimeVersionKey: [self _runtimeVersion],
    EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: self.manifestAndAssetRequestHeaders.manifest.scopeKey,
    EXUpdatesConfig.EXUpdatesConfigRequestHeadersKey: [self _requestHeaders]
  };

  NSError *configError;
  EXUpdatesConfig *config = [EXUpdatesConfig configFromDictionary:updatesConfig error:&configError];
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
  EXUpdatesSelectionPolicy *selectionPolicy = [[EXUpdatesSelectionPolicy alloc]
                                               initWithLauncherSelectionPolicy:[[EXExpoGoLauncherSelectionPolicyFilterAware alloc] initWithSdkVersions:sdkVersions]
                                               loaderSelectionPolicy:[EXUpdatesLoaderSelectionPolicyFilterAware new]
                                               reaperSelectionPolicy:[EXUpdatesReaperSelectionPolicyDevelopmentClient new]];

  EXHomeAppLoaderTask *loaderTask = [[EXHomeAppLoaderTask alloc] initWithManifestAndAssetRequestHeaders:self.manifestAndAssetRequestHeaders
                                                                                                 config:config
                                                                                               database:updatesDatabaseManager.database
                                                                                              directory:updatesDatabaseManager.updatesDirectory
                                                                                        selectionPolicy:selectionPolicy
                                                                                          delegateQueue:_appLoaderQueue];
  loaderTask.delegate = self;
  [loaderTask start];
}

- (void)_setOptimisticManifest:(EXManifestsManifest *)manifest
{
  _optimisticManifest = manifest;
  if (self.delegate) {
    [self.delegate appLoader:self didLoadOptimisticManifest:_optimisticManifest];
  }
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

#pragma mark - headers

- (NSDictionary *)_requestHeaders
{
  NSDictionary *requestHeaders = @{
      @"Exponent-SDK-Version": [EXVersions sharedInstance].sdkVersion,
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

- (NSString *)_runtimeVersion
{
  return [NSString stringWithFormat:@"exposdk:%@", [EXVersions sharedInstance].sdkVersion];
}

+ (EXManifestAndAssetRequestHeaders * _Nullable)bundledDevelopmentHomeManifestAndAssetRequestHeaders
{
  NSString *manifestAndAssetRequestHeadersJson = [EXBuildConstants sharedInstance].kernelManifestAndAssetRequestHeadersJsonString;
  if (!manifestAndAssetRequestHeadersJson) {
    return nil;
  }

  id manifestAndAssetRequestHeaders = RCTJSONParse(manifestAndAssetRequestHeadersJson, nil);
  if ([manifestAndAssetRequestHeaders isKindOfClass:[NSDictionary class]]) {
    id manifest = manifestAndAssetRequestHeaders[@"manifest"];
    id assetRequestHeaders = manifestAndAssetRequestHeaders[@"assetRequestHeaders"];
    if ([manifest isKindOfClass:[NSDictionary class]]) {
      return [[EXManifestAndAssetRequestHeaders alloc] initWithManifest:[EXManifestsManifestFactory manifestForManifestJSON:manifest]
                                                    assetRequestHeaders:assetRequestHeaders];
    }
  }

  return nil;
}

@end

NS_ASSUME_NONNULL_END
