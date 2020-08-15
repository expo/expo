// Copyright 2020-present 650 Industries. All rights reserved.

#import "EXAppFetcher.h"
#import "EXAppLoaderExpoUpdates.h"
#import "EXClientReleaseType.h"
#import "EXEnvironment.h"
#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"
#import "EXSession.h"
#import "EXUpdatesDatabaseManager.h"
#import "EXVersions.h"

#import <EXUpdates/EXUpdatesAppLoaderTask.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesSelectionPolicyNewest.h>
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

@property (nonatomic, strong, nullable) NSError *error;

@property (nonatomic, assign) BOOL shouldUseCacheOnly;

@property (nonatomic, strong) dispatch_queue_t appLoaderQueue;

@property (nonatomic, nullable) EXUpdatesConfig *config;
@property (nonatomic, nullable) id<EXUpdatesSelectionPolicy> selectionPolicy;
@property (nonatomic, nullable) id<EXUpdatesAppLauncher> appLauncher;

@end

@implementation EXAppLoaderExpoUpdates

@synthesize manifestUrl = _manifestUrl;
@synthesize bundle = _bundle;
@synthesize config = _config;
@synthesize selectionPolicy = _selectionPolicy;
@synthesize appLauncher = _appLauncher;

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
  // if cached manifest was dev mode, or a previous run of this app failed due to a loading error, we want to make sure to check for remote updates
  if ([[self class] areDevToolsEnabledWithManifest:update.rawManifest] || [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:[EXAppFetcher experienceIdWithManifest:update.rawManifest]]) {
    if (_shouldUseCacheOnly) {
      _shouldUseCacheOnly = NO;
      dispatch_async(_appLoaderQueue, ^{
        [self _startLoaderTask];
      });
      return NO;
    }
  }
  return YES;
}

- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(EXUpdatesUpdate *)update
{
  [self _setOptimisticManifest:[self _processManifest:update.rawManifest]];
}

- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<EXUpdatesAppLauncher>)launcher
{
  if ([[self class] areDevToolsEnabledWithManifest:launcher.launchedUpdate.rawManifest]) {
    // in dev mode, we need to set an optimistic manifest even if the LoaderTask never sent one
    if (!_optimisticManifest) {
      [self _setOptimisticManifest:[self _processManifest:launcher.launchedUpdate.rawManifest]];
    }
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
  _error = error;
  if (self.delegate) {
    [self.delegate appLoader:self didFailWithError:error];
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
  _config = [EXUpdatesConfig configWithDictionary:@{
    @"EXUpdatesURL": [[self class] _httpUrlFromManifestUrl:_manifestUrl].absoluteString,
    @"EXUpdatesSDKVersion": [self _sdkVersions],
    @"EXUpdatesScopeKey": _manifestUrl.absoluteString,
    @"EXUpdatesHasEmbeddedUpdate": @(NO),
    @"EXUpdatesEnabled": @(YES),
    @"EXUpdatesLaunchWaitMs": _shouldUseCacheOnly ? @(0) : @(10000),
    @"EXUpdatesCheckOnLaunch": _shouldUseCacheOnly ? @"NEVER" : @"ALWAYS",
    @"EXUpdatesRequestHeaders": [self _requestHeaders]
  }];

  EXUpdatesDatabaseManager *updatesDatabaseManager = [EXKernel sharedInstance].serviceRegistry.updatesDatabaseManager;
  _selectionPolicy = [[EXUpdatesSelectionPolicyNewest alloc] initWithRuntimeVersions:[EXVersions sharedInstance].versions[@"sdkVersions"] ?: @[[EXVersions sharedInstance].temporarySdkVersion]];

  EXUpdatesAppLoaderTask *loaderTask = [[EXUpdatesAppLoaderTask alloc] initWithConfig:_config
                                                                             database:updatesDatabaseManager.database
                                                                            directory:updatesDatabaseManager.updatesDirectory
                                                                      selectionPolicy:_selectionPolicy
                                                                        delegateQueue:_appLoaderQueue];
  loaderTask.delegate = self;
  [loaderTask start];
}

- (void)_setOptimisticManifest:(NSDictionary *)manifest
{
  _optimisticManifest = manifest;
  if (self.delegate) {
    [self.delegate appLoader:self didLoadOptimisticManifest:_optimisticManifest];
  }
}

- (void)_loadDevelopmentJavaScriptResource
{
  EXAppFetcher *appFetcher = [[EXAppFetcher alloc] initWithAppLoader:self];
  [appFetcher fetchJSBundleWithManifest:self.optimisticManifest cacheBehavior:EXCachedResourceNoCache timeoutInterval:kEXJSBundleTimeout progress:^(EXLoadingProgress *progress) {
    if (self.delegate) {
      [self.delegate appLoader:self didLoadBundleWithProgress:progress];
    }
  } success:^(NSData *bundle) {
    self.bundle = bundle;
    if (self.delegate) {
      [self.delegate appLoader:self didFinishLoadingManifest:self.optimisticManifest bundle:self.bundle];
    }
  } error:^(NSError *error) {
    self.error = error;
    if (self.delegate) {
      [self.delegate appLoader:self didFailWithError:error];
    }
  }];
}

# pragma mark - manifest processing

- (NSDictionary *)_processManifest:(NSDictionary *)manifest
{
  NSMutableDictionary *mutableManifest = [manifest mutableCopy];
  if (![EXKernelLinkingManager isExpoHostedUrl:_httpManifestUrl] && !EXEnvironment.sharedEnvironment.isDetached){
    // the manifest id determines the namespace/experience id an app is sandboxed with
    // if manifest is hosted by third parties, we sandbox it with the hostname to avoid clobbering exp.host namespaces
    // for https urls, sandboxed id is of form quinlanj.github.io/myProj-myApp
    // for http urls, sandboxed id is of form UNVERIFIED-quinlanj.github.io/myProj-myApp
    NSString *securityPrefix = [_httpManifestUrl.scheme isEqualToString:@"https"] ? @"" : @"UNVERIFIED-";
    NSString *slugSuffix = manifest[@"slug"] ? [@"-" stringByAppendingString:manifest[@"slug"]]: @"";
    mutableManifest[@"id"] = [NSString stringWithFormat:@"%@%@%@%@", securityPrefix, _httpManifestUrl.host, _httpManifestUrl.path ?: @"", slugSuffix];
    mutableManifest[@"isVerified"] = @(YES);
  }
  if (EXEnvironment.sharedEnvironment.isManifestVerificationBypassed || [self _isAnonymousExperience:manifest]) {
    mutableManifest[@"isVerified"] = @(YES);
  }
  if (mutableManifest[@"isVerified"] == nil) {
    mutableManifest[@"isVerified"] = @(NO);
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
