// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXEnvironment.h"
#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXAppFetcher.h"
#import "EXAppFetcherDevelopmentMode.h"
#import "EXAppFetcherCacheOnly.h"
#import "EXAppFetcherWithTimeout.h"
#import "EXAppLoader+Updates.h"
#import "EXKernelAppRecord.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelLinkingManager.h"
#import "EXManifestResource.h"
#import <EXManifests/EXManifestsManifestFactory.h>

#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

NSTimeInterval const kEXAppLoaderDefaultTimeout = 30;
NSTimeInterval const kEXJSBundleTimeout = 60 * 5;

@interface EXAppLoader ()

@property (nonatomic, strong) NSURL * _Nullable manifestUrl;
@property (nonatomic, strong) EXManifestsManifest * _Nullable localManifest; // used by Home. TODO: ben: clean up
@property (nonatomic, strong) NSURL * _Nullable httpManifestUrl;

@property (nonatomic, strong) EXManifestsManifest * _Nullable confirmedManifest; // manifest that is actually being used
@property (nonatomic, strong) EXManifestsManifest * _Nullable cachedManifest; // manifest that is cached and we definitely have, may fall back to it
@property (nonatomic, strong) EXManifestResource * _Nullable manifestResource;

@property (nonatomic, strong) EXAppFetcher * _Nullable appFetcher;
@property (nonatomic, strong) EXAppFetcher * _Nullable previousAppFetcherWaitingForBundle;
@property (nonatomic, strong) NSError * _Nullable error;

@property (nonatomic, assign) BOOL hasFinished;
@property (nonatomic, assign) BOOL shouldUseCacheOnly;

@end

@implementation EXAppLoader

- (instancetype)initWithManifestUrl:(NSURL *)url
{
  if (self = [super init]) {
    _manifestUrl = url;
    _httpManifestUrl = [EXAppLoader _httpUrlFromManifestUrl:_manifestUrl];
  }
  return self;
}

- (instancetype)initWithLocalManifest:(EXManifestsManifest *)manifest
{
  if (self = [super init]) {
    _localManifest = manifest;
  }
  return self;
}

#pragma mark - getters and lifecycle

- (void)_reset
{
  _confirmedManifest = nil;
  _cachedManifest = nil;
  _error = nil;
  _appFetcher = nil;
  _previousAppFetcherWaitingForBundle = nil;
  _hasFinished = NO;
  _shouldUseCacheOnly = NO;
  _manifestResource = nil;
  _shouldShowRemoteUpdateStatus = NO;
  _isUpToDate = YES;
}

- (EXAppLoaderStatus)status
{
  if (_error || (_appFetcher && _appFetcher.error)) {
    return kEXAppLoaderStatusError;
  } else if (_appFetcher && _appFetcher.bundle && _confirmedManifest) {
    return kEXAppLoaderStatusHasManifestAndBundle;
  } else if (_cachedManifest || (_appFetcher && _appFetcher.manifest)) {
    return kEXAppLoaderStatusHasManifest;
  }
  return kEXAppLoaderStatusNew;
}

- (EXManifestsManifest * _Nullable)manifest
{
  if (_confirmedManifest) {
    return _confirmedManifest;
  }
  // remote manifest
  if (_appFetcher && _appFetcher.manifest) {
    return _appFetcher.manifest;
  }
  if (_cachedManifest) {
    return _cachedManifest;
  }
  return nil;
}

- (NSData * _Nullable)bundle
{
  if (_appFetcher) {
    return _appFetcher.bundle;
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
  RCTAssert([self supportsBundleReload], @"Tried to force a bundle reload on a non-development bundle");
  [(EXAppFetcherDevelopmentMode *)_appFetcher forceBundleReload];
}

- (BOOL)supportsBundleReload
{
  return (_appFetcher && [_appFetcher isKindOfClass:[EXAppFetcherDevelopmentMode class]]);
}

#pragma mark - public

- (void)request
{
  [self _reset];
  if (_localManifest) {
    [self _beginRequestWithLocalManifest];
  } else if (_manifestUrl) {
    [self _beginRequestWithRemoteManifest];
  } else {
    [self _finishWithError:RCTErrorWithMessage(@"Can't load app with no remote url nor local manifest.")];
  }
}

- (void)requestFromCache
{
  [self _reset];
  _shouldUseCacheOnly = YES;
  if (_localManifest) {
    [self _beginRequestWithLocalManifest];
  } else if (_manifestUrl) {
    [self _beginRequestWithRemoteManifest];
  } else {
    [self _finishWithError:RCTErrorWithMessage(@"Can't load app with no remote url nor local manifest.")];
  }
}

- (void)writeManifestToCache
{
  if (_manifestResource) {
    [_manifestResource writeToCache];
    _manifestResource = nil;
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

- (void)_beginRequestWithLocalManifest
{
  _confirmedManifest = _localManifest;
  _cachedManifest = _localManifest;
  [self _fetchCachedManifest];
}

- (void)_beginRequestWithRemoteManifest
{
  // if we're in dev mode, don't try loading cached manifest
  if ([_httpManifestUrl.host isEqualToString:@"localhost"]
      || ([EXEnvironment sharedEnvironment].isDetached && [EXEnvironment sharedEnvironment].isDebugXCodeScheme)) {
    // we can't pre-detect if this person is using a developer tool, but using localhost is a pretty solid indicator.
    [self _startAppFetcher:[[EXAppFetcherDevelopmentMode alloc] initWithAppLoader:self]];
  } else {
    [self _fetchCachedManifest];
  }
}

- (void)_fetchCachedManifest
{
  [self fetchManifestWithCacheBehavior:EXManifestOnlyCache success:^(EXManifestsManifest * cachedManifest) {
    self.cachedManifest = cachedManifest;
    [self _fetchBundleWithManifest:cachedManifest];
  } failure:^(NSError * error) {
    [self _startAppFetcher:[[EXAppFetcherWithTimeout alloc] initWithAppLoader:self timeout:kEXAppLoaderDefaultTimeout]];
  }];
}

- (void)_fetchBundleWithManifest:(EXManifestsManifest *)manifest
{
  BOOL shouldCheckForUpdate = YES;
  NSTimeInterval fallbackToCacheTimeout = kEXAppLoaderDefaultTimeout;

  // in case check for dev mode failed before, check again
  if (manifest.isUsingDeveloperTool) {
    [self _startAppFetcher:[[EXAppFetcherDevelopmentMode alloc] initWithAppLoader:self]];
    return;
  }

  id updates = manifest.updatesInfo;
  id ios = manifest.iosConfig;
  if (updates && [updates isKindOfClass:[NSDictionary class]]) {
    NSDictionary *updatesDict = (NSDictionary *)updates;
    id checkAutomaticallyVal = updatesDict[@"checkAutomatically"];
    if (checkAutomaticallyVal && [checkAutomaticallyVal isKindOfClass:[NSString class]] && [(NSString *)checkAutomaticallyVal isEqualToString:@"ON_ERROR_RECOVERY"]) {
      shouldCheckForUpdate = NO;
    }

    id fallbackToCacheTimeoutVal = updatesDict[@"fallbackToCacheTimeout"];
    if (fallbackToCacheTimeoutVal && [fallbackToCacheTimeoutVal isKindOfClass:[NSNumber class]]) {
      fallbackToCacheTimeout = [(NSNumber *)fallbackToCacheTimeoutVal intValue] / 1000.0f;
    }
  } else if (ios && [ios isKindOfClass:[NSDictionary class]]) {
    NSDictionary *iosDict = (NSDictionary *)ios;
    // map loadJSInBackgroundExperimental internally to
    // checkAutomatically: ON_LOAD and fallbackToCacheTimeout: 0
    if (iosDict[@"loadJSInBackgroundExperimental"]) {
      shouldCheckForUpdate = YES;
      fallbackToCacheTimeout = 0;
    }
  }

  // only support checkAutomatically: ON_ERROR_RECOVERY in detached apps
  if (![EXEnvironment sharedEnvironment].isDetached) {
    shouldCheckForUpdate = YES;
  }

  // if this experience id encountered a loading error before,
  // we should always check for an update, even if the manifest says not to
  if ([[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager scopeKeyIsRecoveringFromError:manifest.scopeKey]) {
    shouldCheckForUpdate = YES;
  }

  // if remote updates are disabled, or we're using `reloadFromCache`, don't check for an update.
  // these checks need to be here because they need to happen after the dev mode check above.
  if (_shouldUseCacheOnly ||
      ([EXEnvironment sharedEnvironment].isDetached && ![EXEnvironment sharedEnvironment].areRemoteUpdatesEnabled)) {
    shouldCheckForUpdate = NO;
  }

  if (shouldCheckForUpdate) {
    [self _startAppFetcher:[[EXAppFetcherWithTimeout alloc] initWithAppLoader:self timeout:fallbackToCacheTimeout]];
  } else {
    [self _startAppFetcher:[[EXAppFetcherCacheOnly alloc] initWithAppLoader:self manifest:manifest]];
  }
}

- (void)_startAppFetcher:(EXAppFetcher *)appFetcher
{
  _appFetcher = appFetcher;
  _appFetcher.delegate = self;
  _appFetcher.dataSource = _dataSource;
  _appFetcher.cacheDataSource = self;
  if ([_appFetcher isKindOfClass:[EXAppFetcherDevelopmentMode class]]) {
    ((EXAppFetcherDevelopmentMode *)_appFetcher).developmentModeDelegate = self;
  } else if ([_appFetcher isKindOfClass:[EXAppFetcherWithTimeout class]]) {
    ((EXAppFetcherWithTimeout *)_appFetcher).withTimeoutDelegate = self;
  }
  [_appFetcher start];
}

- (void)_finishWithError:(NSError * _Nullable)err
{
  _error = err;
  if (_delegate) {
    [_delegate appLoader:self didFailWithError:err];
  }
}

#pragma mark - EXAppFetcherCacheDataSource

- (BOOL)isCacheUpToDateWithAppFetcher:(EXAppFetcher *)appFetcher
{
  if (_localManifest) {
    // local manifest won't give us sufficient information to tell
    return NO;
  }
  if (!self.cachedManifest || !appFetcher.manifest) {
    // if either of these don't exist, we don't have enough information to tell
    return NO;
  }
  return appFetcher.manifest.revisionId
  ? [appFetcher.manifest.revisionId isEqualToString:self.cachedManifest.revisionId]
  : NO;
}

#pragma mark - EXAppFetcherDelegate

- (void)appFetcher:(EXAppFetcher *)appFetcher didSwitchToAppFetcher:(EXAppFetcher *)newAppFetcher retainingCurrent:(BOOL)shouldRetain
{
  if (shouldRetain) {
    _previousAppFetcherWaitingForBundle = appFetcher;
  }
  [self _startAppFetcher:newAppFetcher];
}

- (void)appFetcher:(EXAppFetcher *)appFetcher didLoadOptimisticManifest:(EXManifestsManifest *)manifest
{
  if (_delegate) {
    [_delegate appLoader:self didLoadOptimisticManifest:manifest];
  }
}

- (void)appFetcher:(EXAppFetcher *)appFetcher didFinishLoadingManifest:(EXManifestsManifest *)manifest bundle:(NSData *)bundle
{
  _confirmedManifest = manifest;
  if (_delegate) {
    [_delegate appLoader:self didFinishLoadingManifest:manifest bundle:bundle];
  }
}

- (void)appFetcher:(EXAppFetcher *)appFetcher didFailWithError:(NSError *)error
{
  // don't nullify appFetcher - we need to use its state to record the circumstances of the error
  _error = error;
  if (_delegate) {
    [_delegate appLoader:self didFailWithError:error];
  }
  if (appFetcher == _previousAppFetcherWaitingForBundle) {
    // previous app fetcher errored while trying to fetch a new bundle
    // so we can deallocate it now
    _previousAppFetcherWaitingForBundle = nil;
  }
}

#pragma mark - EXAppFetcherDevelopmentModeDelegate

- (void)appFetcher:(EXAppFetcher *)appFetcher didLoadBundleWithProgress:(EXLoadingProgress *)progress
{
  if (_delegate) {
    [_delegate appLoader:self didLoadBundleWithProgress:progress];
  }
}

#pragma mark - EXAppFetcherWithTimeoutDelegate

- (void)appFetcher:(EXAppFetcher *)appFetcher didResolveUpdatedBundleWithManifest:(EXManifestsManifest * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error
{
  if (_delegate) {
    [_delegate appLoader:self didResolveUpdatedBundleWithManifest:manifest isFromCache:isFromCache error:error];
  }
  if (appFetcher == _previousAppFetcherWaitingForBundle) {
    // we no longer need to retain the previous app fetcher
    // as the only reason to retain is to wait for it to finish downloading the new bundle
    _previousAppFetcherWaitingForBundle = nil;
  }
}

#pragma mark - helper methods for fetching

- (void)fetchManifestWithCacheBehavior:(EXManifestCacheBehavior)manifestCacheBehavior success:(void (^)(EXManifestsManifest *))success failure:(void (^)(NSError *))failure
{
  // if we're using a localManifest, just return it immediately
  if (_localManifest) {
    success(_localManifest);
    return;
  }

  if (!([_httpManifestUrl.scheme isEqualToString:@"http"] || [_httpManifestUrl.scheme isEqualToString:@"https"])) {
    NSURLComponents *components = [NSURLComponents componentsWithURL:_httpManifestUrl resolvingAgainstBaseURL:NO];
    components.scheme = @"http";
    _httpManifestUrl = [components URL];
  }

  EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:_httpManifestUrl originalUrl:_manifestUrl];

  EXCachedResourceBehavior cachedResourceBehavior = EXCachedResourceNoCache;
  if (manifestCacheBehavior == EXManifestOnlyCache) {
    cachedResourceBehavior = EXCachedResourceOnlyCache;
  } else if (manifestCacheBehavior == EXManifestPrepareToCache) {
    // in this case, we don't want to use the cache but will prepare to write the resulting manifest
    // to the cache later, after the bundle is finished downloading, so we save the reference
    _manifestResource = manifestResource;
  }
  [manifestResource loadResourceWithBehavior:cachedResourceBehavior progressBlock:nil successBlock:^(NSData * _Nonnull data) {
    NSError *error;
    id manifestJSON = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&error];
    if (!manifestJSON) {
      failure(error);
      return;
    }
    if (![manifestJSON isKindOfClass:[NSDictionary class]]) {
      NSDictionary *errorInfo = @{
                                  NSLocalizedDescriptionKey: @"Cannot parse manifest",
                                  NSLocalizedFailureReasonErrorKey: @"Tried to load a manifest which was not in the proper format",
                                  };
      failure([NSError errorWithDomain:EXNetworkErrorDomain code:-1 userInfo:errorInfo]);
      return;
    }

    // insert loadedFromCache: boolean key into manifest
    NSMutableDictionary *mutableManifestJSON = [(NSDictionary *)manifestJSON mutableCopy];
    BOOL loadedFromCache = YES;
    if (cachedResourceBehavior == EXCachedResourceNoCache) {
      loadedFromCache = NO;
    }
    mutableManifestJSON[@"loadedFromCache"] = @(loadedFromCache);

    success([EXManifestsManifestFactory manifestForManifestJSON:[NSDictionary dictionaryWithDictionary:mutableManifestJSON]]);
  } errorBlock:^(NSError * _Nonnull error) {
#if DEBUG
    if ([EXEnvironment sharedEnvironment].isDetached && error &&
        (error.code == 404 || error.domain == EXNetworkErrorDomain)) {
      NSString *message = error.localizedDescription;
      message = [NSString stringWithFormat:@"Make sure you are serving your project with Expo CLI (%@)", message];
      error = [NSError errorWithDomain:error.domain code:error.code userInfo:@{ NSLocalizedDescriptionKey: message }];
    }
#endif
    failure(error);
  }];
}

- (void)fetchJSBundleWithManifest:(EXManifestsManifest *)manifest
                     cacheBehavior:(EXCachedResourceBehavior)cacheBehavior
                   timeoutInterval:(NSTimeInterval)timeoutInterval
                          progress:(void (^ _Nullable )(EXLoadingProgress *))progressBlock
                           success:(void (^)(NSData *))successBlock
                             error:(void (^)(NSError *))errorBlock
{
  RCTAssert(_appFetcher != nil, @"Tried to fetch a JS Bundle before appFetcher was initialized");
  [_appFetcher fetchJSBundleWithManifest:manifest cacheBehavior:cacheBehavior timeoutInterval:timeoutInterval progress:progressBlock success:successBlock error:errorBlock];
}

@end

NS_ASSUME_NONNULL_END
