// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
#import "EXManifestResource.h"
#import "EXShellManager.h"
#import "EXVersions.h"

#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

int EX_DEFAULT_TIMEOUT_LENGTH = 30000;
NSTimeInterval const kEXJSBundleTimeout = 60 * 5;
NSString *kEXKernelLoadingProgressEventBase = @"loadingProgress";
NSString *kEXKernelOptimisticManifestEventBase = @"optimisticManifest";

@interface EXKernelAppLoader ()

@property (nonatomic, strong) NSURL *manifestUrl;
@property (nonatomic, strong) NSURL * _Nullable httpManifestUrl;
@property (nonatomic, strong) NSDictionary * _Nullable cachedManifest;
@property (nonatomic, readwrite, strong) NSDictionary * _Nullable manifest;
@property (nonatomic, strong) NSData * _Nullable bundle;
@property (nonatomic, strong) NSError * _Nullable bundleError;
@property (nonatomic, copy) void  (^ _Nullable success)(NSDictionary *);
@property (nonatomic, copy) void  (^ _Nullable failure)(NSError *);

@property (nonatomic, weak) id<EXKernelBundleLoaderDelegate> _Nullable bundleLoaderDelegate;

@property (nonatomic, strong) NSTimer * _Nullable timer;
@property (nonatomic, readwrite, assign) BOOL manifestFinished;
@property (nonatomic, readwrite, assign) BOOL bundleFinished;

@end

@implementation EXKernelAppLoader

- (instancetype)initWithManifestUrl:(NSURL *)url
{
  if (self = [super init]) {
    _manifestUrl = url;
  }
  return self;
}

- (void)requestManifestWithHttpUrl:(NSURL *)url success:(void (^)(NSDictionary *))success failure:(void (^)(NSError *))failure
{
  RCTAssert(_success == nil && _failure == nil, @"Tried to register multiple success or failure handlers for requestManifestWithHttpUrl with manifestUrl: %@", _manifestUrl);
  _success = success;
  _failure = failure;
  _manifestFinished = NO;
  _httpManifestUrl = url;

  // if we're in dev mode, don't try loading cached manifest
  if ([url.host isEqualToString:@"localhost"]) {
    // we can't pre-detect if this person is using a developer tool, but using localhost is a pretty solid indicator.
    [self _fetchRemoteManifestWithHttpUrl:url shouldFallBackToCache:NO timeoutLength:0];
    return;
  }

  // first get cached manifest
  // then try to fetch new one over network
  [self _fetchManifestWithHttpUrl:url cacheBehavior:EXCachedResourceOnlyCache success:^(NSDictionary * cachedManifest) {
    _cachedManifest = cachedManifest;

    BOOL shouldCheckForUpdate = YES;
    int fallbackToCacheTimeout = EX_DEFAULT_TIMEOUT_LENGTH;

    id updates = _cachedManifest[@"updates"];
    if (updates && [updates isKindOfClass:[NSDictionary class]]) {
      NSDictionary *updatesDict = (NSDictionary *)updates;
      id checkAutomaticallyVal = updatesDict[@"checkAutomatically"];
      if (checkAutomaticallyVal && [checkAutomaticallyVal isKindOfClass:[NSString class]] && [(NSString *)checkAutomaticallyVal isEqualToString:@"never"]) {
        shouldCheckForUpdate = NO;
      }

      id fallbackToCacheTimeoutVal = updatesDict[@"fallbackToCacheTimeout"];
      if (fallbackToCacheTimeoutVal && [fallbackToCacheTimeoutVal isKindOfClass:[NSNumber class]]) {
        fallbackToCacheTimeout = [(NSNumber *)fallbackToCacheTimeoutVal intValue];
      }
    }

    if ([[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:[self _experienceIdWithManifest:_cachedManifest]]) {
      // if this experience id encountered a loading error before,
      // we should always check for an update, even if the manifest says not to
      shouldCheckForUpdate = YES;
    }

    if (shouldCheckForUpdate) {
      [self _fetchRemoteManifestWithHttpUrl:url shouldFallBackToCache:YES timeoutLength:fallbackToCacheTimeout];
    } else {
      [self _resolve:nil];
    }
  } failure:^(NSError * error) {
    [self _fetchRemoteManifestWithHttpUrl:url shouldFallBackToCache:YES timeoutLength:EX_DEFAULT_TIMEOUT_LENGTH];
  }];
}

- (void)requestJSBundleWithDelegate:(id<EXKernelBundleLoaderDelegate>)delegate
{
  _bundleLoaderDelegate = delegate;

  if ([self _areDevToolsEnabledWithManifest:_manifest]) {
    // if we're in dev mode, just pass through directly to the downloader since we don't want to time out
    void (^progressBlock)(EXLoadingProgress * _Nonnull) = ^(EXLoadingProgress * _Nonnull progress) {
      [_bundleLoaderDelegate appLoader:self didLoadBundleWithProgress:progress];
    };
    void (^successBlock)(NSData * _Nonnull) = ^(NSData * _Nonnull data) {
      [_bundleLoaderDelegate appLoader:self didFinishLoadingBundle:data];
    };
    void (^errorBlock)(NSError * _Nonnull) = ^(NSError * _Nonnull error) {
      [_bundleLoaderDelegate appLoader:self didFailLoadingBundleWithError:error];
    };
    [self _fetchJSBundleWithManifest:_manifest
                       cacheBehavior:[self _cacheBehaviorForJSWithManifest:_manifest]
                     timeoutInterval:kEXJSBundleTimeout
                            progress:progressBlock
                             success:successBlock
                               error:errorBlock];
  } else if (_manifestFinished) {
    // if we're too late and everything has already finished downloading, call _resolveBundle explicitly so that we can get the delegate callbacks
    // otherwise _resolveBundle will be called elsewhere when the bundle finishes downloading
    [self _resolveBundle:nil];
  }
}

# pragma mark - internal logic

- (void)_fetchRemoteManifestWithHttpUrl:(NSURL *)url shouldFallBackToCache:(BOOL)useTimer timeoutLength:(int)timeoutLengthInMs
{
  if (useTimer && !_timer) {
    EXKernelAppLoader * __weak weakSelf = self;
    _timer = [NSTimer scheduledTimerWithTimeInterval:(timeoutLengthInMs / 1000) repeats:NO block:^(NSTimer * _Nonnull timer) {
      [weakSelf _resolve:nil];
    }];
  }

  EXCachedResourceBehavior cacheBehavior = EXCachedResourceWriteToCache;
  if (!useTimer) {
    // if we're in dev mode (meaning we should not ever fall back to cache), don't write to the cache either
    cacheBehavior = EXCachedResourceNoCache;
  }
  if ([EXShellManager sharedInstance].loadJSInBackgroundExperimental) {
    cacheBehavior = EXCachedResourceUseCacheImmediately;
  }
  [self _fetchManifestWithHttpUrl:url cacheBehavior:cacheBehavior success:^(NSDictionary * _Nonnull manifest) {
    _manifest = manifest;
    [self _fetchRemoteJSBundleWithManifest:manifest];
    // send new manifest optimistically to JS so it can display the proper loading icon/color/etc
    [self _sendOptimisticManifest:manifest];
  } failure:^(NSError * _Nonnull error) {
    [self _resolve:error];
  }];
}

- (void)_fetchRemoteJSBundleWithManifest:(NSDictionary *)manifest
{
  if ([self _areDevToolsEnabledWithManifest:manifest]) {
    // ignore in dev mode, we'll just go straight through to the downloader instead
    _success(manifest);
    _manifestFinished = YES;
    return;
  }
  EXCachedResourceBehavior cacheBehavior = [self _cacheBehaviorForJSWithManifest:manifest];

  [self _fetchJSBundleWithManifest:manifest cacheBehavior:cacheBehavior timeoutInterval:kEXJSBundleTimeout progress:^(EXLoadingProgress * _Nonnull progress) {
    [self _sendBundleProgress:progress];
  } success:^(NSData * _Nonnull data) {
    _bundle = data;
    [self _resolve:nil];
  } error:^(NSError * _Nonnull error) {
    [self _resolve:error];
  }];
}

- (void)_stopTimer
{
  if (_timer) {
    [_timer invalidate];
    _timer = nil;
  }
}

- (void)_resolve:(NSError * _Nullable)err
{
  if (_manifestFinished) {
    return;
  }

  [self _stopTimer];

  if (_manifest && _bundle) {
    _success(_manifest);
    [self _resolveBundle:err];
    _manifestFinished = YES;
  } else if (_cachedManifest) {
    _success(_cachedManifest);
    _manifest = _cachedManifest;
    [self _resolveBundle:err];
    _manifestFinished = YES;
  } else {
    _failure(err);
  }

  if (_manifest && ![[EXKernel sharedInstance].appRegistry isExperienceIdUnique:[self _experienceIdWithManifest:_manifest]]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"experienceId is not unique across AppRegistry" userInfo:nil];
  }
}

- (void)_resolveBundle:(NSError * _Nullable)err
{
  if (!_bundleLoaderDelegate || [self _areDevToolsEnabledWithManifest:_manifest]) {
    return;
  }

  if (_manifest && _bundle) {
    _bundleFinished = YES;
    [_bundleLoaderDelegate appLoader:self didFinishLoadingBundle:_bundle];
  } else if (_cachedManifest) {
    [self _fetchJSBundleWithManifest:_cachedManifest cacheBehavior:EXCachedResourceFallBackToNetwork timeoutInterval:kEXJSBundleTimeout progress:^(EXLoadingProgress * _Nonnull progress) {
      [self _sendBundleProgress:progress];
    } success:^(NSData * _Nonnull data) {
      _bundleFinished = YES;
      _bundle = data;
      [_bundleLoaderDelegate appLoader:self didFinishLoadingBundle:data];
    } error:^(NSError * _Nonnull error) {
      _bundleFinished = YES;
      _bundleError = error;
      [_bundleLoaderDelegate appLoader:self didFailLoadingBundleWithError:error];
    }];
  } else {
    [_bundleLoaderDelegate appLoader:self didFailLoadingBundleWithError:err];
  }
}

- (void)_sendBundleProgress:(EXLoadingProgress *)progress
{
  NSDictionary *eventBody = @{
                              @"status": RCTNullIfNil(progress.status),
                              @"done": RCTNullIfNil(progress.done),
                              @"total": RCTNullIfNil(progress.total),
                              };
  NSString *eventName = [NSString stringWithFormat:@"%@-%@", kEXKernelLoadingProgressEventBase, _manifestUrl.absoluteString];
  [[EXKernel sharedInstance] dispatchKernelJSEvent:eventName body:eventBody onSuccess:nil onFailure:nil];
}

- (void)_sendOptimisticManifest:(NSDictionary *)manifest
{
  NSString *eventName = [NSString stringWithFormat:@"%@-%@", kEXKernelOptimisticManifestEventBase, _manifestUrl.absoluteString];
  [[EXKernel sharedInstance] dispatchKernelJSEvent:eventName body:manifest onSuccess:nil onFailure:nil];
}

#pragma mark - fetch resource methods

- (void)_fetchManifestWithHttpUrl:(NSURL *)url cacheBehavior:(EXCachedResourceBehavior)cacheBehavior success:(void (^)(NSDictionary *))success failure:(void (^)(NSError *))failure
{
  // this fetch behavior should never be used, as we re-create it ourselves within this class
  if (cacheBehavior == EXCachedResourceFallBackToCache) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"EXManifestResource should never be loaded with FallBackToCache behavior"
                                 userInfo:nil];
  }

  if (!([url.scheme isEqualToString:@"http"] || [url.scheme isEqualToString:@"https"])) {
    NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:NO];
    components.scheme = @"http";
    url = [components URL];
  }
  EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:url originalUrl:_manifestUrl];
  [manifestResource loadResourceWithBehavior:cacheBehavior progressBlock:nil successBlock:^(NSData * _Nonnull data) {
    NSError *error;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&error];
    if (!manifest) {
      failure(error);
      return;
    }
    if (![manifest isKindOfClass:[NSDictionary class]]) {
      // TODO: handle this - make own NSError
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
      [[NSNotificationCenter defaultCenter] postNotificationName:kEXKernelAppDidDisplay object:self];
    }
#endif
    failure(error);
  }];
}

- (void)_fetchJSBundleWithManifest:(NSDictionary *)manifest
                     cacheBehavior:(EXCachedResourceBehavior)cacheBehavior
                   timeoutInterval:(NSTimeInterval)timeoutInterval
                          progress:( void (^ _Nullable )(EXLoadingProgress *))progressBlock
                           success:(void (^)(NSData *))successBlock
                             error:(void (^)(NSError *))errorBlock
{
  EXJavaScriptResource *jsResource = [[EXJavaScriptResource alloc] initWithBundleName:[self _bundleNameWithManifest:manifest]
                                                                            remoteUrl:[self _bundleUrlWithManifest:manifest]
                                                                      devToolsEnabled:[self _areDevToolsEnabledWithManifest:manifest]];
  jsResource.abiVersion = [[EXVersions sharedInstance] availableSdkVersionForManifest:manifest];
  jsResource.requestTimeoutInterval = timeoutInterval;

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
  if ([EXShellManager sharedInstance].loadJSInBackgroundExperimental && ![self _areDevToolsEnabledWithManifest:manifest]) {
    return EXCachedResourceUseCacheImmediately;
  }
  if ([self _areDevToolsEnabledWithManifest:manifest]) {
    return EXCachedResourceNoCache;
  }
  return EXCachedResourceWriteToCache;
}

@end

NS_ASSUME_NONNULL_END
