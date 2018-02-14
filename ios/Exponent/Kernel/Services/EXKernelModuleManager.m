// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
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
  EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
  return (
    appRegistry.lastKnownForegroundAppManager != appRegistry.kernelAppManager &&
    [appRegistry.lastKnownForegroundAppManager areDevtoolsEnabled]
  );
}

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForKernelModule:(EXKernelModule *)module
{
  return [[EXKernel sharedInstance].appRegistry.lastKnownForegroundAppManager devMenuItems];
}

- (void)kernelModule:(EXKernelModule *)module didSelectDevMenuItemWithKey:(NSString *)key
{
  [[EXKernel sharedInstance].appRegistry.lastKnownForegroundAppManager selectDevMenuItemWithKey:key];
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
  NSString *foregroundTaskExperienceId = [EXKernel sharedInstance].appRegistry.lastKnownForegroundAppManager.experienceId;
  return [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdShouldReloadOnError:foregroundTaskExperienceId];
}

- (void)kernelModule:(__unused EXKernelModule *)module taskDidForegroundWithType:(NSInteger)type params:(NSDictionary *)params
{
  [[EXKernel sharedInstance] handleJSTaskDidForegroundWithType:type params:params];
}

- (void)kernelModule:(EXKernelModule *)module didRequestManifestWithUrl:(NSURL *)url originalUrl:(NSURL *)originalUrl success:(void (^)(NSString *))success failure:(void (^)(NSError *))failure
{
  EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
  NSString *recordId = [appRegistry registerAppWithManifestUrl:originalUrl];
  EXKernelAppRecord *record = [appRegistry recordForId:recordId];
  [record.appLoader requestManifestWithHttpUrl:url success:^(NSDictionary * _Nonnull manifest) {
    NSError *err;
    NSMutableDictionary *mutableManifest = [manifest mutableCopy];
    // TODO: ditch this once the kernel JS is gone and we can just send the recordId directly to the frame
    mutableManifest[@"recordId"] = recordId;
    NSString *manifestString = [[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:manifest options:kNilOptions error:&err] encoding:NSUTF8StringEncoding];
    if (manifestString) {
      success(manifestString);
    } else {
      failure(err);
    }
  } failure:failure];
}

- (void)kernelModule:(__unused EXKernelModule *)module didOpenUrl:(NSString *)url
{
  [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:url isUniversalLink:NO];
}

@end
