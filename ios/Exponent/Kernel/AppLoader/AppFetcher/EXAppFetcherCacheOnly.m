// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppFetcherCacheOnly.h"
#import "EXAbstractLoader.h"
#import "EXEnvironment.h"

NS_ASSUME_NONNULL_BEGIN

@implementation EXAppFetcherCacheOnly

- (instancetype)initWithAppLoader:(EXAbstractLoader *)appLoader manifest:(EXManifestsManifest *)manifest;
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
    [self.appLoader fetchManifestWithCacheBehavior:EXManifestOnlyCache success:^(EXManifestsManifest * _Nonnull manifest) {
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
