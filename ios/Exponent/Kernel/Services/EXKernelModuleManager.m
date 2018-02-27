// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
#import "EXKernelDevKeyCommands.h"
#import "EXKernelDevMotionHandler.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelModuleManager.h"
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
  // TODO: BEN: menu, reimpl native
  /* EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
  return (
    appRegistry.lastKnownForegroundAppManager != appRegistry.kernelAppManager &&
    [appRegistry.lastKnownForegroundAppManager areDevtoolsEnabled]
  ); */
  return NO;
}

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForKernelModule:(EXKernelModule *)module
{
  // TODO: BEN: menu, reimpl native
  // return [[EXKernel sharedInstance].appRegistry.lastKnownForegroundAppManager devMenuItems];
  return @{};
}

- (void)kernelModule:(EXKernelModule *)module didSelectDevMenuItemWithKey:(NSString *)key
{
  // TODO: BEN: menu, reimpl native
  // [[EXKernel sharedInstance].appRegistry.lastKnownForegroundAppManager selectDevMenuItemWithKey:key];
}

- (void)kernelModuleDidSelectHomeDiagnostics:(__unused EXKernelModule *)module
{
  if ([EXKernel sharedInstance].browserController) {
    [EXUtil performSynchronouslyOnMainThread:^{
      [[EXKernel sharedInstance].browserController showDiagnostics];
    }];
  }
}

- (BOOL)kernelModuleShouldAutoReloadCurrentTask:(EXKernelModule *)module
{
  // TODO: ben: error recovery audit
  NSString *visibleAppExperienceId = [EXKernel sharedInstance].visibleApp.experienceId;
  return [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdShouldReloadOnError:visibleAppExperienceId];
}

- (void)kernelModule:(__unused EXKernelModule *)module didOpenUrl:(NSString *)url
{
  [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:url isUniversalLink:NO];
}

@end
