// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXKernelDevKeyCommands.h"
#import "EXKernelDevMenuViewController.h"
#import "EXKernelDevMotionHandler.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelModuleManager.h"
#import "EXKernelReactAppManager.h"
#import "EXManifestResource.h"
#import "EXReactAppManager.h"
#import "EXShellManager.h"
#import "EXViewController.h"

@implementation EXKernelModuleManager

- (instancetype)init
{
  if (self = [super init]) {
    [EXKernelDevMotionHandler sharedInstance];
    [EXKernelDevKeyCommands sharedInstance];
  }
  return self;
}

- (BOOL)kernelModuleShouldEnableLegacyMenuBehavior:(EXKernelModule *)module
{
  return [EXKernelDevKeyCommands sharedInstance].isLegacyMenuBehaviorEnabled;
}

- (void)kernelModule:(EXKernelModule *)module didSelectEnableLegacyMenuBehavior:(BOOL)isEnabled
{
  [EXKernelDevKeyCommands sharedInstance].isLegacyMenuBehaviorEnabled = isEnabled;
}

- (BOOL)kernelModuleShouldEnableDevtools:(__unused EXKernelModule *)module
{
  EXKernelBridgeRegistry *bridgeRegistry = [EXKernel sharedInstance].bridgeRegistry;
  return (
    bridgeRegistry.lastKnownForegroundAppManager != bridgeRegistry.kernelAppManager &&
    [bridgeRegistry.lastKnownForegroundAppManager areDevtoolsEnabled]
  );
}

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForKernelModule:(EXKernelModule *)module
{
  return [[EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundAppManager devMenuItems];
}

- (void)kernelModule:(EXKernelModule *)module didSelectDevMenuItemWithKey:(NSString *)key
{
  [[EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundAppManager selectDevMenuItemWithKey:key];
}

- (void)kernelModuleDidSelectKernelDevMenu:(__unused EXKernelModule *)module
{
  EXKernelDevMenuViewController *vcDevMenu = [[EXKernelDevMenuViewController alloc] init];
  if ([EXKernel sharedInstance].rootViewController) {
    [[EXKernel sharedInstance].rootViewController presentViewController:vcDevMenu animated:YES completion:nil];
  }
}

- (BOOL)kernelModuleShouldAutoReloadCurrentTask:(EXKernelModule *)module
{
  NSString *foregroundTaskExperienceId = [EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundAppManager.experienceId;
  return [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdShouldReloadOnError:foregroundTaskExperienceId];
}

- (void)kernelModule:(__unused EXKernelModule *)module taskDidForegroundWithType:(NSInteger)type params:(NSDictionary *)params
{
  [[EXKernel sharedInstance] handleJSTaskDidForegroundWithType:type params:params];
}

- (void)kernelModule:(EXKernelModule *)module didRequestManifestWithUrl:(NSURL *)url originalUrl:(NSURL *)originalUrl success:(void (^)(NSString *))success failure:(void (^)(NSError *))failure
{
  if (!([url.scheme isEqualToString:@"http"] || [url.scheme isEqualToString:@"https"])) {
    NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:NO];
    components.scheme = @"http";
    url = [components URL];
  }
  EXCachedResourceBehavior cacheBehavior = kEXCachedResourceFallBackToCache;
  if ([url.host isEqualToString:@"localhost"]) {
    // we can't pre-detect if this person is using a developer tool, but using localhost is a pretty solid indicator.
    cacheBehavior = kEXCachedResourceNoCache;
  }
  if ([EXShellManager sharedInstance].loadJSInBackgroundExperimental) {
    cacheBehavior = kEXCachedResourceUseCacheImmediately;
  }
  EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:url originalUrl:originalUrl];
  [manifestResource loadResourceWithBehavior:cacheBehavior progressBlock:nil successBlock:^(NSData * _Nonnull data) {
    NSString *manifestString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    success(manifestString);
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

- (void)kernelModule:(__unused EXKernelModule *)module didOpenUrl:(NSString *)url
{
  [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:url isUniversalLink:NO];
}

@end
