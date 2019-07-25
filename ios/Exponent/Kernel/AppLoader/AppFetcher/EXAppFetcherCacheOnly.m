// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppFetcherCacheOnly.h"
#import "EXAppLoader.h"
#import "EXEnvironment.h"

NS_ASSUME_NONNULL_BEGIN

@implementation EXAppFetcherCacheOnly

- (instancetype)initWithAppLoader:(EXAppLoader *)appLoader manifest:(NSDictionary *)manifest;
{
  if (self = [super initWithAppLoader:appLoader]) {
    self.manifest = manifest;
  }
  return self;
}

- (void)start
{
  if (self.manifest) {
    [self startWithManifest];
  } else {
    [self.appLoader fetchManifestWithCacheBehavior:EXManifestOnlyCache success:^(NSDictionary * _Nonnull manifest) {
      self.manifest = manifest;
      [self startWithManifest];
    } failure:^(NSError * _Nonnull error) {
      [self _finishWithError:error];
    }];
  }
}

- (void)startWithManifest
{
  [self.delegate appFetcher:self didLoadOptimisticManifest:self.manifest];
  [self _fetchJSBundle];
}

- (void)_fetchJSBundle
{
  EXCachedResourceBehavior cacheBehavior = EXCachedResourceOnlyCache;
  // This is a bit messy, but essentially as long as remote updates are enabled
  // we never want to 100% fall back to cache, since the OS can reap files from
  // the cache and we might not have a JS bundle even if we have its corresponding
  // manifest cached. We always prefer using the network as a last ditch effort to
  // download a bundle rather than failing to launch or showing an error screen.
  // TODO(eric): in new updates impl make this less messy
  if ([EXEnvironment sharedEnvironment].areRemoteUpdatesEnabled) {
    cacheBehavior = EXCachedResourceFallBackToNetwork;
  }
  __weak typeof(self) weakSelf = self;
  [self fetchJSBundleWithManifest:self.manifest cacheBehavior:cacheBehavior timeoutInterval:kEXJSBundleTimeout progress:nil success:^(NSData * _Nonnull data) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      strongSelf.bundle = data;
      [strongSelf _finishWithError:nil];
    }
  } error:^(NSError * _Nonnull error) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf _finishWithError:error];
    }
  }];
}

- (void)_finishWithError:(NSError * _Nullable)err
{
  if (self.bundle) {
    [self.delegate appFetcher:self didFinishLoadingManifest:self.manifest bundle:self.bundle];
  } else {
    self.error = err;
    [self.delegate appFetcher:self didFailWithError:self.error];
  }
}

@end

NS_ASSUME_NONNULL_END
