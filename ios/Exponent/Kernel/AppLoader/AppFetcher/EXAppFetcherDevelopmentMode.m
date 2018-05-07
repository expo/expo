// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppFetcherDevelopmentMode.h"
#import "EXAppLoader.h"

NS_ASSUME_NONNULL_BEGIN

@implementation EXAppFetcherDevelopmentMode

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
    [self.appLoader fetchManifestWithCacheBehavior:EXCachedResourceNoCache success:^(NSDictionary * _Nonnull manifest) {
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
}

- (void)forceBundleReload
{
  if (self.bundle) {
    self.bundle = nil;
  }
  [self _fetchRemoteJSBundle];
}

- (void)_fetchRemoteJSBundle
{
  __weak typeof(self) weakSelf = self;
  [self fetchJSBundleWithManifest:self.manifest cacheBehavior:EXCachedResourceNoCache timeoutInterval:kEXJSBundleTimeout progress:^(EXLoadingProgress * _Nonnull progress) {
    [self.developmentModeDelegate appFetcher:self didLoadBundleWithProgress:progress];
  } success:^(NSData * _Nonnull data) {
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
