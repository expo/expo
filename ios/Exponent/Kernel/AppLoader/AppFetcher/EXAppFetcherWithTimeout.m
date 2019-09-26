// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppFetcherCacheOnly.h"
#import "EXAppFetcherDevelopmentMode.h"
#import "EXAppFetcherWithTimeout.h"
#import "EXAppLoader.h"
#import "EXUtil.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXAppFetcherWithTimeout ()

@property (nonatomic, strong) NSTimer * _Nullable timer;
@property (nonatomic, assign) BOOL hasFinished;
@property (nonatomic, assign) NSTimeInterval timeout;

@end

@implementation EXAppFetcherWithTimeout

- (instancetype)initWithAppLoader:(EXAppLoader *)appLoader timeout:(NSTimeInterval)timeout;
{
  if (self = [super initWithAppLoader:appLoader]) {
    _timeout = timeout;
  }
  return self;
}

- (void)dealloc
{
  [self _stopTimer];
}

- (void)start
{
  if (_timeout > 0) {
    [EXUtil performSynchronouslyOnMainThread:^{
      self->_timer = [NSTimer scheduledTimerWithTimeInterval:self->_timeout target:self selector:@selector(_timeOutWithTimer:) userInfo:nil repeats:NO];
    }];
  } else {
    // resolve right away but continue downloading updated code in the background
    [self _finishWithError:nil];
  }

  [self.appLoader fetchManifestWithCacheBehavior:EXManifestPrepareToCache success:^(NSDictionary * _Nonnull manifest) {
    self.manifest = manifest;
    if ([[self class] areDevToolsEnabledWithManifest:manifest] && self.timer) {
      // make sure we never time out in dev mode
      // this can happen because there is no cached manifest & therefore we fall back to default behavior w/ timer
      [self _stopTimer];
      EXAppFetcherDevelopmentMode *newFetcher = [[EXAppFetcherDevelopmentMode alloc] initWithAppLoader:self.appLoader manifest:manifest];
      [self.delegate appFetcher:self didSwitchToAppFetcher:newFetcher retainingCurrent:NO];
      return;
    }
    [self.delegate appFetcher:self didLoadOptimisticManifest:self.manifest];
    [self _fetchRemoteJSBundle];
  } failure:^(NSError * _Nonnull error) {
    [self _finishWithError:error];
  }];
}

- (void)_fetchRemoteJSBundle
{
  EXCachedResourceBehavior cacheBehavior = [[self class] cacheBehaviorForJSWithManifest:self.manifest];
  if ([self.cacheDataSource isCacheUpToDateWithAppFetcher:self]) {
    cacheBehavior = EXCachedResourceFallBackToNetwork;
  }

  __weak typeof(self) weakSelf = self;
  [self fetchJSBundleWithManifest:self.manifest cacheBehavior:cacheBehavior timeoutInterval:kEXJSBundleTimeout progress:nil success:^(NSData * _Nonnull data) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      strongSelf.bundle = data;
      [strongSelf _finishWithError:nil];
      [strongSelf.appLoader writeManifestToCache];
    }
  } error:^(NSError * _Nonnull error) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
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

- (void)_timeOutWithTimer:(__unused id)timer
{
  [self _finishWithError:nil];
}

- (void)_finishWithError:(NSError * _Nullable)err
{
  [self _stopTimer];
  
  if (_hasFinished && self.manifest) {
    // AppFetcher has already "finished" but a new bundle was resolved
    // so we should notify the delegate so it can send an event to the running app
    [self.withTimeoutDelegate appFetcher:self
     didResolveUpdatedBundleWithManifest:self.manifest
                             isFromCache:[self.cacheDataSource isCacheUpToDateWithAppFetcher:self]
                                   error:err];
  }
  _hasFinished = YES;
  
  if (self.bundle) {
    // we have everything
    [self.delegate appFetcher:self didFinishLoadingManifest:self.manifest bundle:self.bundle];
  } else if (self.appLoader.manifest) {
    // we don't have a bundle but need to finish, so switch to a cache-only AppFetcher
    EXAppFetcherCacheOnly *newFetcher = [[EXAppFetcherCacheOnly alloc] initWithAppLoader:self.appLoader manifest:self.appLoader.cachedManifest];
    [self.delegate appFetcher:self didSwitchToAppFetcher:newFetcher retainingCurrent:YES];
  } else {
    // we have nothing to work with at all
    self.error = err;
    [self.delegate appFetcher:self didFailWithError:self.error];
  }
}

@end

NS_ASSUME_NONNULL_END
