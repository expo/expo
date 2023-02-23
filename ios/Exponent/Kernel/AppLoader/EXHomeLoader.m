// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXEnvironment.h"
#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXAppFetcher.h"
#import "EXAppFetcherDevelopmentMode.h"
#import "EXAppFetcherCacheOnly.h"
#import "EXAppFetcherWithTimeout.h"
#import "EXHomeLoader.h"
#import "EXKernelAppRecord.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelLinkingManager.h"
#import "EXManifestResource.h"

#import <React/RCTUtils.h>

@import EXManifests;

NS_ASSUME_NONNULL_BEGIN

NSTimeInterval const kEXAppLoaderDefaultTimeout = 30;
NSTimeInterval const kEXJSBundleTimeout = 60 * 5;

@interface EXHomeLoader()

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

@property (nonatomic, assign) BOOL shouldShowRemoteUpdateStatus;
@property (nonatomic, assign) BOOL isUpToDate;

@end

@implementation EXHomeLoader

@synthesize manifestUrl;
@synthesize cachedManifest;
@synthesize shouldShowRemoteUpdateStatus;
@synthesize isUpToDate;

- (instancetype)initWithManifestUrl:(NSURL *)url
{
// ENG-7047: no home updates or remote manifests in release builds
#if DEBUG
  if (self = [super init]) {
    self.manifestUrl = url;
    self.httpManifestUrl = [EXHomeLoader _httpUrlFromManifestUrl:self.manifestUrl];
  }
  return self;
#else
  [self doesNotRecognizeSelector:_cmd];
  return self;
#endif
}

- (instancetype)initWithLocalManifest:(EXManifestsManifest *)manifest
{
  if (self = [super init]) {
    self.localManifest = manifest;
  }
  return self;
}

#pragma mark - getters and lifecycle

- (void)_reset
{
  self.confirmedManifest = nil;
  self.cachedManifest = nil;
  self.error = nil;
  self.appFetcher = nil;
  self.previousAppFetcherWaitingForBundle = nil;
  self.hasFinished = NO;
  self.shouldUseCacheOnly = NO;
  self.manifestResource = nil;
  self.shouldShowRemoteUpdateStatus = NO;
  self.isUpToDate = YES;
}

- (EXAppLoaderStatus)status
{
  if (self.error || (self.appFetcher && self.appFetcher.error)) {
    return kEXAppLoaderStatusError;
  } else if (self.appFetcher && self.appFetcher.bundle && self.confirmedManifest) {
    return kEXAppLoaderStatusHasManifestAndBundle;
  } else if (self.cachedManifest || (self.appFetcher && self.appFetcher.manifest)) {
    return kEXAppLoaderStatusHasManifest;
  }
  return kEXAppLoaderStatusNew;
}

- (EXManifestsManifest * _Nullable)manifest
{
  if (self.confirmedManifest) {
    return self.confirmedManifest;
  }
  // remote manifest
  if (self.appFetcher && self.appFetcher.manifest) {
    return self.appFetcher.manifest;
  }
  if (self.cachedManifest) {
    return self.cachedManifest;
  }
  return nil;
}

- (NSData * _Nullable)bundle
{
  if (self.appFetcher) {
    return self.appFetcher.bundle;
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
  [(EXAppFetcherDevelopmentMode *)self.appFetcher forceBundleReload];
}

- (BOOL)supportsBundleReload
{
  return (self.appFetcher && [self.appFetcher isKindOfClass:[EXAppFetcherDevelopmentMode class]]);
}

#pragma mark - public

- (void)request
{
  [self _reset];
  if (self.localManifest) {
    [self _beginRequestWithLocalManifest];
// ENG-7047: no home updates or remote manifests in release builds
#if DEBUG
  } else if (self.manifestUrl) {
    [self _beginRequestWithRemoteManifest];
#endif
  } else {
    [self _finishWithError:RCTErrorWithMessage(@"Can't load app with no remote url nor local manifest.")];
  }
}

- (void)requestFromCache
{
  [self _reset];
  self.shouldUseCacheOnly = YES;
  if (self.localManifest) {
    [self _beginRequestWithLocalManifest];
// ENG-7047: no home updates or remote manifests in release builds
#if DEBUG
  } else if (self.manifestUrl) {
    [self _beginRequestWithRemoteManifest];
#endif
  } else {
    [self _finishWithError:RCTErrorWithMessage(@"Can't load app with no remote url nor local manifest.")];
  }
}

- (void)writeManifestToCache
{
  if (self.manifestResource) {
    [self.manifestResource writeToCache];
    self.manifestResource = nil;
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
  self.confirmedManifest = self.localManifest;
  self.cachedManifest = self.localManifest;
  [self _fetchCachedManifest];
}

// ENG-7047: no home updates or remote manifests in release builds
#if DEBUG
- (void)_beginRequestWithRemoteManifest
{
  // if we're in dev mode, don't try loading cached manifest
  if ([self.httpManifestUrl.host isEqualToString:@"localhost"]
      || ([EXEnvironment sharedEnvironment].isDetached && [EXEnvironment sharedEnvironment].isDebugXCodeScheme)) {
    // we can't pre-detect if this person is using a developer tool, but using localhost is a pretty solid indicator.
    [self _startAppFetcher:[[EXAppFetcherDevelopmentMode alloc] initWithAppLoader:self]];
  } else {
    [self _fetchCachedManifest];
  }
}
#endif

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

// ENG-7047: no home updates or remote manifests in release builds
#if DEBUG

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
  if (self.shouldUseCacheOnly ||
      ([EXEnvironment sharedEnvironment].isDetached && ![EXEnvironment sharedEnvironment].areRemoteUpdatesEnabled)) {
    shouldCheckForUpdate = NO;
  }

// ENG-7047: no home updates or remote manifests in release builds
#else
  shouldCheckForUpdate = NO;
#endif // DEBUG

  if (shouldCheckForUpdate) {
    [self _startAppFetcher:[[EXAppFetcherWithTimeout alloc] initWithAppLoader:self timeout:fallbackToCacheTimeout]];
  } else {
    [self _startAppFetcher:[[EXAppFetcherCacheOnly alloc] initWithAppLoader:self manifest:manifest]];
  }
}

- (void)_startAppFetcher:(EXAppFetcher *)appFetcher
{
  self.appFetcher = appFetcher;
  self.appFetcher.delegate = self;
  self.appFetcher.dataSource = self.dataSource;
  self.appFetcher.cacheDataSource = self;
  if ([self.appFetcher isKindOfClass:[EXAppFetcherDevelopmentMode class]]) {
    ((EXAppFetcherDevelopmentMode *)self.appFetcher).developmentModeDelegate = self;
  } else if ([self.appFetcher isKindOfClass:[EXAppFetcherWithTimeout class]]) {
    ((EXAppFetcherWithTimeout *)self.appFetcher).withTimeoutDelegate = self;
  }
  [self.appFetcher start];
}

- (void)_finishWithError:(NSError * _Nullable)err
{
  self.error = err;
  if (self.delegate) {
    [self.delegate appLoader:self didFailWithError:err];
  }
}

#pragma mark - EXAppFetcherCacheDataSource

- (BOOL)isCacheUpToDateWithAppFetcher:(EXAppFetcher *)appFetcher
{
  if (self.localManifest) {
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
    self.previousAppFetcherWaitingForBundle = appFetcher;
  }
  [self _startAppFetcher:newAppFetcher];
}

- (void)appFetcher:(EXAppFetcher *)appFetcher didLoadOptimisticManifest:(EXManifestsManifest *)manifest
{
  if (self.delegate) {
    [self.delegate appLoader:self didLoadOptimisticManifest:manifest];
  }
}

- (void)appFetcher:(EXAppFetcher *)appFetcher didFinishLoadingManifest:(EXManifestsManifest *)manifest bundle:(NSData *)bundle
{
  self.confirmedManifest = manifest;
  if (self.delegate) {
    [self.delegate appLoader:self didFinishLoadingManifest:manifest bundle:bundle];
  }
}

- (void)appFetcher:(EXAppFetcher *)appFetcher didFailWithError:(NSError *)error
{
  // don't nullify appFetcher - we need to use its state to record the circumstances of the error
  self.error = error;
  if (self.delegate) {
    [self.delegate appLoader:self didFailWithError:error];
  }
  if (appFetcher == self.previousAppFetcherWaitingForBundle) {
    // previous app fetcher errored while trying to fetch a new bundle
    // so we can deallocate it now
    self.previousAppFetcherWaitingForBundle = nil;
  }
}

#pragma mark - EXAppFetcherDevelopmentModeDelegate

- (void)appFetcher:(EXAppFetcher *)appFetcher didLoadBundleWithProgress:(EXLoadingProgress *)progress
{
  if (self.delegate) {
    [self.delegate appLoader:self didLoadBundleWithProgress:progress];
  }
}

#pragma mark - EXAppFetcherWithTimeoutDelegate

- (void)appFetcher:(EXAppFetcher *)appFetcher didResolveUpdatedBundleWithManifest:(EXManifestsManifest * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error
{
  if (self.delegate) {
    [self.delegate appLoader:self didResolveUpdatedBundleWithManifest:manifest isFromCache:isFromCache error:error];
  }
  if (appFetcher == self.previousAppFetcherWaitingForBundle) {
    // we no longer need to retain the previous app fetcher
    // as the only reason to retain is to wait for it to finish downloading the new bundle
    self.previousAppFetcherWaitingForBundle = nil;
  }
}

#pragma mark - helper methods for fetching

- (void)fetchManifestWithCacheBehavior:(EXManifestCacheBehavior)manifestCacheBehavior success:(void (^)(EXManifestsManifest *))success failure:(void (^)(NSError *))failure
{
  // if we're using a localManifest, just return it immediately
  if (self.localManifest) {
    success(self.localManifest);
    return;
  }

  if (!([self.httpManifestUrl.scheme isEqualToString:@"http"] || [self.httpManifestUrl.scheme isEqualToString:@"https"])) {
    NSURLComponents *components = [NSURLComponents componentsWithURL:self.httpManifestUrl resolvingAgainstBaseURL:NO];
    components.scheme = @"http";
    self.httpManifestUrl = [components URL];
  }

  EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:self.httpManifestUrl originalUrl:self.manifestUrl];

  EXCachedResourceBehavior cachedResourceBehavior = EXCachedResourceNoCache;
  if (manifestCacheBehavior == EXManifestOnlyCache) {
    cachedResourceBehavior = EXCachedResourceOnlyCache;
  } else if (manifestCacheBehavior == EXManifestPrepareToCache) {
    // in this case, we don't want to use the cache but will prepare to write the resulting manifest
    // to the cache later, after the bundle is finished downloading, so we save the reference
    self.manifestResource = manifestResource;
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

@end

NS_ASSUME_NONNULL_END
