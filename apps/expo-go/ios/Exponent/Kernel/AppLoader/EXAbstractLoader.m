// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXAppFetcher.h"
#import "EXAbstractLoader.h"
#import "EXKernelAppRecord.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelLinkingManager.h"
#import "EXManifestResource.h"

#import <React/RCTUtils.h>

@import EXManifests;

NS_ASSUME_NONNULL_BEGIN

NSTimeInterval const kEXAppLoaderDefaultTimeout = 30;
NSTimeInterval const kEXJSBundleTimeout = 60 * 5;

@implementation EXAbstractLoader

- (instancetype)initWithManifestUrl:(NSURL *)url
{
  [self doesNotRecognizeSelector:_cmd];
  return nil;
}

- (instancetype)initWithLocalManifest:(EXManifestsManifest *)manifest
{
  [self doesNotRecognizeSelector:_cmd];
  return nil;
}

- (void)fetchManifestWithCacheBehavior:(EXManifestCacheBehavior)cacheBehavior success:(void (^)(EXManifestsManifest * _Nonnull))success failure:(void (^)(NSError * _Nonnull))failure
{
  [self doesNotRecognizeSelector:_cmd];
}

- (void)request
{
  [self doesNotRecognizeSelector:_cmd];
}

- (void)requestFromCache
{
  [self doesNotRecognizeSelector:_cmd];
}

- (void)forceBundleReload
{
  [self doesNotRecognizeSelector:_cmd];
}

- (BOOL)supportsBundleReload
{
  [self doesNotRecognizeSelector:_cmd];
  return NO;
}

- (void)writeManifestToCache
{
  [self doesNotRecognizeSelector:_cmd];
}

#pragma mark -
#pragma mark EXAppFetcher delegate methods

- (void)appFetcher:(nonnull EXAppFetcher *)appFetcher didFailWithError:(nonnull NSError *)error {
  [self doesNotRecognizeSelector:_cmd];
}

- (void)appFetcher:(nonnull EXAppFetcher *)appFetcher didFinishLoadingManifest:(nonnull EXManifestsManifest *)manifest bundle:(nonnull NSData *)bundle {
  [self doesNotRecognizeSelector:_cmd];
}

- (void)appFetcher:(nonnull EXAppFetcher *)appFetcher didLoadOptimisticManifest:(nonnull EXManifestsManifest *)manifest {
  [self doesNotRecognizeSelector:_cmd];
}

- (void)appFetcher:(nonnull EXAppFetcher *)appFetcher didSwitchToAppFetcher:(nonnull EXAppFetcher *)newAppFetcher retainingCurrent:(BOOL)shouldRetain {
  [self doesNotRecognizeSelector:_cmd];
}

- (void)appFetcher:(nonnull EXAppFetcher *)appFetcher didLoadBundleWithProgress:(nonnull EXLoadingProgress *)progress {
  [self doesNotRecognizeSelector:_cmd];
}

- (void)appFetcher:(nonnull EXAppFetcher *)appFetcher didResolveUpdatedBundleWithManifest:(EXManifestsManifest * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error {
  [self doesNotRecognizeSelector:_cmd];
}

- (BOOL)isCacheUpToDateWithAppFetcher:(nonnull EXAppFetcher *)appFetcher {
  [self doesNotRecognizeSelector:_cmd];
  return NO;
}

@end

NS_ASSUME_NONNULL_END
