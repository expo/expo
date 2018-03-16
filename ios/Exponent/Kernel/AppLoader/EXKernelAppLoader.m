// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXKernelAppLoader+Updates.h"
#import "EXKernelAppRecord.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelLinkingManager.h"
#import "EXManifestResource.h"
#import "EXShellManager.h"
#import "EXVersions.h"

#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

int EX_DEFAULT_TIMEOUT_LENGTH = 30000;
NSTimeInterval const kEXJSBundleTimeout = 60 * 5;

@interface EXKernelAppLoader ()

@property (nonatomic, strong) NSURL * _Nullable manifestUrl;
@property (nonatomic, strong) NSDictionary * _Nullable localManifest; // used by Home. TODO: ben: clean up
@property (nonatomic, strong) NSURL * _Nullable httpManifestUrl;

@property (nonatomic, strong) NSDictionary * _Nullable confirmedManifest; // definitely working, cached
@property (nonatomic, strong) NSDictionary * _Nullable optimisticManifest; // we haven't completely downloaded a bundle for this and we haven't cached it

@property (nonatomic, strong) NSData * _Nullable bundle;
@property (nonatomic, strong) NSError * _Nullable error;

@property (nonatomic, strong) NSTimer * _Nullable timer;
@property (nonatomic, assign) BOOL hasFinished;

@end

@implementation EXKernelAppLoader

- (instancetype)initWithManifestUrl:(NSURL *)url
{
  if (self = [super init]) {
    _manifestUrl = url;
    _httpManifestUrl = [EXKernelAppLoader _httpUrlFromManifestUrl:_manifestUrl];
  }
  return self;
}

- (instancetype)initWithLocalManifest:(NSDictionary *)manifest
{
  if (self = [super init]) {
    _localManifest = manifest;
  }
  return self;
}

- (void)dealloc
{
  [self _stopTimer];
}

#pragma mark - getters and lifecycle

- (void)_reset
{
  _confirmedManifest = nil;
  _optimisticManifest = nil;
  _error = nil;
  _bundle = nil;
  _hasFinished = NO;
}

- (EXKernelAppLoaderStatus)status
{
  if (_error) {
    return kEXKernelAppLoaderStatusError;
  } else if (_bundle && _confirmedManifest) {
    return kEXKernelAppLoaderStatusHasManifestAndBundle;
  } else if (_optimisticManifest || _confirmedManifest) {
    return kEXKernelAppLoaderStatusHasManifest;
  }
  return kEXKernelAppLoaderStatusNew;
}

- (NSDictionary * _Nullable)manifest
{
  if (_optimisticManifest) {
    return _optimisticManifest;
  }
  if (_confirmedManifest) {
    return _confirmedManifest;
  }
  return nil;
}

- (void)forceBundleReload
{
  if (self.status == kEXKernelAppLoaderStatusNew) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Tried to load a bundle from an AppLoader with no manifest."
                                 userInfo:@{}];
  }
  if (!_optimisticManifest) {
    _optimisticManifest = _confirmedManifest;
  }
  if (_bundle) {
    _bundle = nil;
  }
  [self _fetchRemoteJSBundleWithOptimisticManifest];
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

#pragma mark - internal

+ (NSURL *)_httpUrlFromManifestUrl:(NSURL *)url
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:YES];
  components.scheme = @"http";
  NSMutableString *path = [((components.path) ? components.path : @"") mutableCopy];
  path = [[EXKernelLinkingManager stringByRemovingDeepLink:path] mutableCopy];
  if (path.length == 0 || [path characterAtIndex:path.length - 1] != '/') {
    [path appendString:@"/"];
  }
  [path appendString:@"index.exp"];
  components.path = path;
  return [components URL];
}

- (BOOL)_isCacheUpToDate
{
  return self.confirmedManifest && self.optimisticManifest && self.confirmedManifest[@"revisionId"] && [self.confirmedManifest[@"revisionId"] isEqualToString:self.optimisticManifest[@"revisionId"]];
}

- (void)_beginRequestWithLocalManifest
{
  _confirmedManifest = _localManifest;
  _optimisticManifest = _localManifest;
  [self _fetchRemoteJSBundleInProductionWithOptimisticManifest];
  if (_delegate) {
    [_delegate appLoader:self didLoadOptimisticManifest:_optimisticManifest];
  }
}

- (void)_beginRequestWithRemoteManifest
{
  // if we're in dev mode, don't try loading cached manifest
  if ([_httpManifestUrl.host isEqualToString:@"localhost"]) {
    // we can't pre-detect if this person is using a developer tool, but using localhost is a pretty solid indicator.
    [self _resolveManifestAndBundleWithTimeout:NO length:0];
    return;
  }
  
  // first get cached manifest
  // then try to fetch new one over network
  [self fetchManifestWithCacheBehavior:EXCachedResourceOnlyCache success:^(NSDictionary * cachedManifest) {
    _confirmedManifest = cachedManifest;

    BOOL shouldCheckForUpdate = YES;
    int fallbackToCacheTimeout = EX_DEFAULT_TIMEOUT_LENGTH;

    // in case check for dev mode failed before, check again
    if ([self _areDevToolsEnabledWithManifest:cachedManifest]) {
      [self _resolveManifestAndBundleWithTimeout:NO length:0];
      return;
    }

    id updates = _confirmedManifest[@"updates"];
    id ios = _confirmedManifest[@"ios"];
    if (updates && [updates isKindOfClass:[NSDictionary class]]) {
      NSDictionary *updatesDict = (NSDictionary *)updates;
      id checkAutomaticallyVal = updatesDict[@"checkAutomatically"];
      if (checkAutomaticallyVal && [checkAutomaticallyVal isKindOfClass:[NSString class]] && [(NSString *)checkAutomaticallyVal isEqualToString:@"onErrorRecovery"]) {
        shouldCheckForUpdate = NO;
      }

      id fallbackToCacheTimeoutVal = updatesDict[@"fallbackToCacheTimeout"];
      if (fallbackToCacheTimeoutVal && [fallbackToCacheTimeoutVal isKindOfClass:[NSNumber class]]) {
        fallbackToCacheTimeout = [(NSNumber *)fallbackToCacheTimeoutVal intValue];
      }
    } else if (ios && [ios isKindOfClass:[NSDictionary class]]) {
      NSDictionary *iosDict = (NSDictionary *)ios;
      // map loadJSInBackgroundExperimental internally to
      // checkAutomatically: onLoad and fallbackToCacheTimeout: 0
      if (iosDict[@"loadJSInBackgroundExperimental"]) {
        shouldCheckForUpdate = YES;
        fallbackToCacheTimeout = 0;
      }
    }

    // only support checkAutomatically: onErrorRecovery in shell & detached apps
    if (![EXKernel sharedInstance].appRegistry.standaloneAppRecord) {
      shouldCheckForUpdate = YES;
    }

    // if this experience id encountered a loading error before,
    // we should always check for an update, even if the manifest says not to
    if ([[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:[self _experienceIdWithManifest:_confirmedManifest]]) {
      shouldCheckForUpdate = YES;
    }

    // if we've disabled updates, override everything else
    if ([EXShellManager sharedInstance].isShell && ![EXShellManager sharedInstance].areRemoteUpdatesEnabled) {
      shouldCheckForUpdate = NO;
    }

    if (shouldCheckForUpdate) {
      [self _resolveManifestAndBundleWithTimeout:YES length:fallbackToCacheTimeout];
    } else {
      [self _finishWithError:nil];
    }
  } failure:^(NSError * error) {
    [self _resolveManifestAndBundleWithTimeout:YES length:EX_DEFAULT_TIMEOUT_LENGTH];
  }];
}

/**
 *  Pass NO to not use a timer, and not fall back to any cache.
 */
- (void)_resolveManifestAndBundleWithTimeout:(BOOL)shouldUseTimer length:(NSUInteger)timeoutLengthInMs
{
  if (shouldUseTimer && !_timer) {
    if (timeoutLengthInMs > 0) {
      _timer = [NSTimer scheduledTimerWithTimeInterval:(timeoutLengthInMs / 1000) target:self selector:@selector(_finishWithError:) userInfo:nil repeats:NO];
    } else {
      // resolve right away but continue downloading updated code in the background
      [self _finishWithError:nil];
    }
  }
  
  EXCachedResourceBehavior cacheBehavior = EXCachedResourceWriteToCache;
  if (!shouldUseTimer) {
    // if we're in dev mode (meaning we should not ever fall back to cache), don't write to the cache either
    cacheBehavior = EXCachedResourceNoCache;
  }
  [self fetchManifestWithCacheBehavior:cacheBehavior success:^(NSDictionary * _Nonnull manifest) {
    _optimisticManifest = manifest;
    // if we're never using a cache, go ahead and confirm the manifest now
    if (cacheBehavior == EXCachedResourceNoCache && !_confirmedManifest) {
      _confirmedManifest = _optimisticManifest;
    }
    [self _fetchRemoteJSBundleInProductionWithOptimisticManifest];
    if (_delegate) {
      [_delegate appLoader:self didLoadOptimisticManifest:_optimisticManifest];
    }
  } failure:^(NSError * _Nonnull error) {
    [self _finishWithError:error];
  }];
}

- (void)_fetchRemoteJSBundleInProductionWithOptimisticManifest
{
  if ([self _areDevToolsEnabledWithManifest:_optimisticManifest]) {
    // stop and wait for somebody to manually ask for the bundle via `forceBundleReload`.
  } else {
    [self _fetchRemoteJSBundleWithOptimisticManifest];
  }
}

- (void)_fetchRemoteJSBundleWithOptimisticManifest
{
  EXCachedResourceBehavior cacheBehavior = [self _cacheBehaviorForJSWithManifest:_optimisticManifest];
  if ([self _isCacheUpToDate]) {
    cacheBehavior = EXCachedResourceFallBackToNetwork;
  }

  __weak typeof(self) weakSelf = self;
  [self fetchJSBundleWithManifest:_optimisticManifest cacheBehavior:cacheBehavior timeoutInterval:kEXJSBundleTimeout progress:^(EXLoadingProgress * _Nonnull progress) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf && strongSelf.delegate) {
      [_delegate appLoader:strongSelf didLoadBundleWithProgress:progress];
    }
  } success:^(NSData * _Nonnull data) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      if (!_hasFinished) {
        // promote optimistic manifest to confirmed manifest.
        strongSelf.confirmedManifest = strongSelf.optimisticManifest;
        strongSelf.optimisticManifest = nil;
      }
      strongSelf.bundle = data;
      [strongSelf _finishWithError:nil];
    }
  } error:^(NSError * _Nonnull error) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      // discard optimistic manifest.
      strongSelf.optimisticManifest = nil;
      [strongSelf _finishWithError:error];
    }
  }];
}

- (void)_stopTimer
{
  if (_timer) {
    [_timer invalidate];
    _timer = nil;
  }
}

- (void)_finishWithError:(NSError * _Nullable)err
{
  [self _stopTimer];

  if (_hasFinished) {
    // AppLoader has already "finished" but a new bundle was resolved
    // so we should notify the delegate so it can send an event to the running app
    [_delegate appLoader:self didResolveUpdatedBundleWithManifest:_optimisticManifest isFromCache:[self _isCacheUpToDate] error:err];
  }
  _hasFinished = YES;

  if (_optimisticManifest) {
    // we're finishing no matter what, so discard any optimistic manifest that hasn't been confirmed yet.
    _optimisticManifest = nil;
  }
  
  if (_bundle) {
    // we have everything
    if (_delegate) {
      [_delegate appLoader:self didFinishLoadingManifest:_confirmedManifest bundle:_bundle];
    }
  } else if (_confirmedManifest) {
    // we don't have a bundle but need to finish,
    // try to grab a cache
    [self fetchJSBundleWithManifest:_confirmedManifest cacheBehavior:EXCachedResourceFallBackToNetwork timeoutInterval:kEXJSBundleTimeout progress:^(EXLoadingProgress * _Nonnull progress) {
      if (_delegate) {
        [_delegate appLoader:self didLoadBundleWithProgress:progress];
      }
    } success:^(NSData * _Nonnull data) {
      _bundle = data;
      if (_delegate) {
        [_delegate appLoader:self didFinishLoadingManifest:_confirmedManifest bundle:_bundle];
      }
    } error:^(NSError * _Nonnull error) {
      _error = error;
      if (_delegate) {
        [_delegate appLoader:self didFailWithError:error];
      }
    }];
  } else {
    // we have nothing to work with at all
    _error = err;
    if (_delegate) {
      [_delegate appLoader:self didFailWithError:err];
    }
  }
}

- (void)fetchManifestWithCacheBehavior:(EXCachedResourceBehavior)cacheBehavior success:(void (^)(NSDictionary *))success failure:(void (^)(NSError *))failure
{
  // this fetch behavior should never be used, as we re-create it ourselves within this class
  if (cacheBehavior == EXCachedResourceFallBackToCache) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"EXManifestResource should never be loaded with FallBackToCache behavior"
                                 userInfo:nil];
  }
  
  if (!([_httpManifestUrl.scheme isEqualToString:@"http"] || [_httpManifestUrl.scheme isEqualToString:@"https"])) {
    NSURLComponents *components = [NSURLComponents componentsWithURL:_httpManifestUrl resolvingAgainstBaseURL:NO];
    components.scheme = @"http";
    _httpManifestUrl = [components URL];
  }
  EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:_httpManifestUrl originalUrl:_manifestUrl];
  [manifestResource loadResourceWithBehavior:cacheBehavior progressBlock:nil successBlock:^(NSData * _Nonnull data) {
    NSError *error;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&error];
    if (!manifest) {
      failure(error);
      return;
    }
    if (![manifest isKindOfClass:[NSDictionary class]]) {
      NSDictionary *errorInfo = @{
                                  NSLocalizedDescriptionKey: @"Cannot parse manifest",
                                  NSLocalizedFailureReasonErrorKey: @"Tried to load a manifest which was not in the proper format",
                                  };
      failure([NSError errorWithDomain:EXNetworkErrorDomain code:-1 userInfo:errorInfo]);
      return;
    }
    
    // insert loadedFromCache: boolean key into manifest
    NSMutableDictionary *mutableManifest = [(NSDictionary *)manifest mutableCopy];
    
    BOOL loadedFromCache = YES;
    if (cacheBehavior == EXCachedResourceNoCache || cacheBehavior == EXCachedResourceWriteToCache) {
      loadedFromCache = NO;
    }
    
    mutableManifest[@"loadedFromCache"] = @(loadedFromCache);
    success([NSDictionary dictionaryWithDictionary:mutableManifest]);
  } errorBlock:^(NSError * _Nonnull error) {
#if DEBUG
    if ([EXShellManager sharedInstance].isShell && error &&
        (error.code == 404 || error.domain == EXNetworkErrorDomain)) {
      NSString *message = error.localizedDescription;
      message = [NSString stringWithFormat:@"Make sure you are serving your project from XDE or exp (%@)", message];
      error = [NSError errorWithDomain:error.domain code:error.code userInfo:@{ NSLocalizedDescriptionKey: message }];
    }
#endif
    failure(error);
  }];
}

- (void)fetchJSBundleWithManifest:(NSDictionary *)manifest
                     cacheBehavior:(EXCachedResourceBehavior)cacheBehavior
                   timeoutInterval:(NSTimeInterval)timeoutInterval
                          progress:(void (^ _Nullable )(EXLoadingProgress *))progressBlock
                           success:(void (^)(NSData *))successBlock
                             error:(void (^)(NSError *))errorBlock
{
  EXJavaScriptResource *jsResource = [[EXJavaScriptResource alloc] initWithBundleName:[self _bundleNameWithManifest:manifest]
                                                                            remoteUrl:[self _bundleUrlWithManifest:manifest]
                                                                      devToolsEnabled:[self _areDevToolsEnabledWithManifest:manifest]];
  jsResource.abiVersion = [[EXVersions sharedInstance] availableSdkVersionForManifest:manifest];
  jsResource.requestTimeoutInterval = timeoutInterval;

  EXCachedResourceBehavior behavior = cacheBehavior;
  // if we've disabled updates, ignore all other settings and only use the cache
  if ([EXShellManager sharedInstance].isShell && ![EXShellManager sharedInstance].areRemoteUpdatesEnabled) {
    behavior = EXCachedResourceOnlyCache;
  }

  [jsResource loadResourceWithBehavior:cacheBehavior progressBlock:progressBlock successBlock:successBlock errorBlock:errorBlock];
}

# pragma mark - params for fetching JS bundle

- (NSString *)_experienceIdWithManifest:(NSDictionary *)manifest
{
  id experienceIdJsonValue = manifest[@"id"];
  if (experienceIdJsonValue) {
    RCTAssert([experienceIdJsonValue isKindOfClass:[NSString class]], @"Manifest contains an id which is not a string: %@", experienceIdJsonValue);
    return experienceIdJsonValue;
  }
  return nil;
}

- (NSURL *)_bundleUrlWithManifest:(NSDictionary *)manifest
{
  id bundleUrlJsonValue = manifest[@"bundleUrl"];
  if (bundleUrlJsonValue) {
    RCTAssert([bundleUrlJsonValue isKindOfClass:[NSString class]], @"Manifest contains a bundleUrl which is not a string: %@", bundleUrlJsonValue);
    return [NSURL URLWithString:bundleUrlJsonValue relativeToURL:_httpManifestUrl];
  }
  return nil;
}

- (NSString *)_bundleNameWithManifest:(NSDictionary *)manifest
{
  if ([EXShellManager sharedInstance].isShell) {
    NSLog(@"EXKernelAppLoader: Standalone bundle remote url is %@", [EXShellManager sharedInstance].shellManifestUrl);
    return kEXShellBundleResourceName;
  } else {
    return [self _experienceIdWithManifest:manifest];
  }
}

- (BOOL)_areDevToolsEnabledWithManifest:(NSDictionary *)manifest
{
  NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
  BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
  return (isDeployedFromTool);
}

- (EXCachedResourceBehavior)_cacheBehaviorForJSWithManifest:(NSDictionary * _Nonnull)manifest
{
  if ([[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:[self _experienceIdWithManifest:manifest]]) {
    // if this experience id encountered a loading error before, discard any cache we might have
    return EXCachedResourceWriteToCache;
  }
  if ([self _areDevToolsEnabledWithManifest:manifest]) {
    return EXCachedResourceNoCache;
  }
  return EXCachedResourceWriteToCache;
}

@end

NS_ASSUME_NONNULL_END
