// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiUtil.h"
#import "EXAppFetcher+Private.h"
#import "EXAbstractLoader.h"
#import "EXEnvironment.h"
#import "EXErrorRecoveryManager.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXVersions.h"

#import <React/RCTUtils.h>

@import EXManifests;

NS_ASSUME_NONNULL_BEGIN

@implementation EXAppFetcher

- (instancetype)initWithAppLoader:(EXAbstractLoader *)appLoader
{
  if (self = [super init]) {
    _appLoader = appLoader;
  }
  return self;
}

- (void)start
{
  // overridden by subclasses
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call EXAppFetcher#start -- use a subclass instead" userInfo:nil];
}

- (void)fetchJSBundleWithManifest:(EXManifestsManifest *)manifest
                    cacheBehavior:(EXCachedResourceBehavior)cacheBehavior
                  timeoutInterval:(NSTimeInterval)timeoutInterval
                         progress:(void (^ _Nullable )(EXLoadingProgress *))progressBlock
                          success:(void (^)(NSData *))successBlock
                            error:(void (^)(NSError *))errorBlock
{
  EXJavaScriptResource *jsResource = [[EXJavaScriptResource alloc] initWithBundleName:[self.dataSource bundleResourceNameForAppFetcher:self withManifest:manifest]
                                                                            remoteUrl:[EXApiUtil bundleUrlFromManifest:manifest]
                                                                      devToolsEnabled:manifest.isUsingDeveloperTool];
  jsResource.abiVersion = [[EXVersions sharedInstance] availableSdkVersionForManifest:manifest];
  jsResource.requestTimeoutInterval = timeoutInterval;
  
  if ([self.dataSource appFetcherShouldInvalidateBundleCache:self]) {
    [jsResource removeCache];
  }

  [jsResource loadResourceWithBehavior:cacheBehavior progressBlock:progressBlock successBlock:successBlock errorBlock:errorBlock];
}

+ (EXCachedResourceBehavior)cacheBehaviorForJSWithManifest:(EXManifestsManifest * _Nonnull)manifest
{
  if ([[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager scopeKeyIsRecoveringFromError:manifest.scopeKey]) {
    // if this experience id encountered a loading error before, discard any cache we might have
    return EXCachedResourceWriteToCache;
  }
  if (manifest.isUsingDeveloperTool) {
    return EXCachedResourceNoCache;
  }
  return EXCachedResourceWriteToCache;
}

@end

NS_ASSUME_NONNULL_END

