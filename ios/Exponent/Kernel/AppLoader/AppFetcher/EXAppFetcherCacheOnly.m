// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppFetcherCacheOnly.h"
#import "EXAppLoader.h"

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
  __weak typeof(self) weakSelf = self;
  [self fetchJSBundleWithManifest:self.manifest cacheBehavior:EXCachedResourceOnlyCache timeoutInterval:kEXJSBundleTimeout progress:nil success:^(NSData * _Nonnull data) {
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
