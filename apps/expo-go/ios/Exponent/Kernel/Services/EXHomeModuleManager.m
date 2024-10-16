// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader.h"
#import "EXFileDownloader.h"
#import "EXHomeModuleManager.h"
#import "EXManifestResource.h"
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"
#import "EXReactAppManager.h"

@implementation EXHomeModuleManager

// TODO: (@tsapeta) Move all of those dev menu methods out of here and make them independent of the kernel.

- (BOOL)homeModuleShouldEnableDevtools:(__unused EXHomeModule *)module
{
  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  return (
    visibleApp != [EXKernel sharedInstance].appRegistry.homeAppRecord &&
    [visibleApp.appManager enablesDeveloperTools]
  );
  return NO;
}

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForHomeModule:(EXHomeModule *)module
{
  return [[EXKernel sharedInstance].visibleApp.appManager devMenuItems];
}

- (void)homeModule:(EXHomeModule *)module didSelectDevMenuItemWithKey:(NSString *)key
{
  [[EXKernel sharedInstance].visibleApp.appManager selectDevMenuItemWithKey:key];
  [module requestToCloseDevMenu];
}

- (void)homeModuleDidSelectRefresh:(EXHomeModule *)module
{
  [[EXKernel sharedInstance] reloadVisibleApp];
  [module requestToCloseDevMenu];
}

- (void)homeModuleDidSelectGoToHome:(EXHomeModule *)module
{
  if ([EXKernel sharedInstance].browserController) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[EXKernel sharedInstance].browserController moveHomeToVisible];
    });
  }
  [module requestToCloseDevMenu];
}

- (void)homeModuleDidSelectQRReader:(EXHomeModule *)module
{
  if ([EXKernel sharedInstance].browserController) {
    [EXUtil performSynchronouslyOnMainThread:^{
      [[EXKernel sharedInstance].browserController showQRReader];
    }];
  }
}

- (void)homeModule:(__unused EXHomeModule *)module didOpenUrl:(NSString *)url
{
  [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:url isUniversalLink:NO];
}

- (void)homeModule:(EXHomeModule *)homeModule didFinishNux:(BOOL)isNuxFinished
{
  if ([EXKernel sharedInstance].browserController) {
    [[EXKernel sharedInstance].browserController setIsNuxFinished:isNuxFinished];
  }
}

- (BOOL)homeModuleShouldFinishNux:(EXHomeModule *)homeModule
{
  if ([EXKernel sharedInstance].browserController) {
    return [[EXKernel sharedInstance].browserController isNuxFinished];
  }
  return NO;
}

@end
