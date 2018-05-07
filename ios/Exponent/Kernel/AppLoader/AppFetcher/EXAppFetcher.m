// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiUtil.h"
#import "EXErrorRecoveryManager.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXAppFetcher+Private.h"
#import "EXAppLoader.h"
#import "EXShellManager.h"
#import "EXVersions.h"

#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXAppFetcher

- (instancetype)initWithAppLoader:(EXAppLoader *)appLoader
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

- (void)fetchJSBundleWithManifest:(NSDictionary *)manifest
                    cacheBehavior:(EXCachedResourceBehavior)cacheBehavior
                  timeoutInterval:(NSTimeInterval)timeoutInterval
                         progress:(void (^ _Nullable )(EXLoadingProgress *))progressBlock
                          success:(void (^)(NSData *))successBlock
                            error:(void (^)(NSError *))errorBlock
{
  EXJavaScriptResource *jsResource = [[EXJavaScriptResource alloc] initWithBundleName:[self.dataSource bundleResourceNameForAppFetcher:self withManifest:manifest]
                                                                            remoteUrl:[EXApiUtil bundleUrlFromManifest:manifest]
                                                                      devToolsEnabled:[[self class] areDevToolsEnabledWithManifest:manifest]];
  jsResource.abiVersion = [[EXVersions sharedInstance] availableSdkVersionForManifest:manifest];
  jsResource.requestTimeoutInterval = timeoutInterval;

  EXCachedResourceBehavior behavior = cacheBehavior;
  // if we've disabled updates, ignore all other settings and only use the cache
  if ([EXShellManager sharedInstance].isShell && ![EXShellManager sharedInstance].areRemoteUpdatesEnabled) {
    behavior = EXCachedResourceOnlyCache;
  }

  if ([self.dataSource appFetcherShouldInvalidateBundleCache:self]) {
    [jsResource removeCache];
  }

  [jsResource loadResourceWithBehavior:cacheBehavior progressBlock:progressBlock successBlock:successBlock errorBlock:errorBlock];
}

+ (NSString *)experienceIdWithManifest:(NSDictionary * _Nonnull)manifest
{
  id experienceIdJsonValue = manifest[@"id"];
  if (experienceIdJsonValue) {
    RCTAssert([experienceIdJsonValue isKindOfClass:[NSString class]], @"Manifest contains an id which is not a string: %@", experienceIdJsonValue);
    return experienceIdJsonValue;
  }
  return nil;
}

+ (BOOL)areDevToolsEnabledWithManifest:(NSDictionary * _Nonnull)manifest
{
  NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
  BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
  return (isDeployedFromTool);
}

+ (EXCachedResourceBehavior)cacheBehaviorForJSWithManifest:(NSDictionary * _Nonnull)manifest
{
  if ([[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:[[self class] experienceIdWithManifest:manifest]]) {
    // if this experience id encountered a loading error before, discard any cache we might have
    return EXCachedResourceWriteToCache;
  }
  if ([[self class] areDevToolsEnabledWithManifest:manifest]) {
    return EXCachedResourceNoCache;
  }
  return EXCachedResourceWriteToCache;
}

@end

NS_ASSUME_NONNULL_END

