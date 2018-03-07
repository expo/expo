// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "EXAppDelegate.h"
#import "EXAppViewController.h"
#import "EXHomeAppManager.h"
#import "EXHomeDiagnosticsViewController.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
#import "EXKernelAppRecord.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelServiceRegistry.h"
#import "EXMenuViewController.h"
#import "EXRootViewController.h"

NSString * const kEXHomeDisableNuxDefaultsKey = @"EXKernelDisableNuxDefaultsKey";
NSString * const kEXHomeIsNuxFinishedDefaultsKey = @"EXHomeIsNuxFinishedDefaultsKey";

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController () <EXAppBrowserController>

@property (nonatomic, strong) EXMenuViewController *menuViewController;
@property (nonatomic, assign) BOOL isMenuVisible;

@end

@implementation EXRootViewController

- (instancetype)init
{
  if (self = [super init]) {
    [EXKernel sharedInstance].browserController = self;
    [self _maybeResetNuxState];
  }
  return self;
}

#pragma mark - EXViewController

- (void)createRootAppAndMakeVisible
{
  EXHomeAppManager *homeAppManager = [[EXHomeAppManager alloc] init];
  EXKernelAppLoader *homeAppLoader = [[EXKernelAppLoader alloc] initWithLocalManifest:[EXHomeAppManager bundledHomeManifest]];
  EXKernelAppRecord *homeAppRecord = [[EXKernelAppRecord alloc] initWithAppLoader:homeAppLoader appManager:homeAppManager];
  [[EXKernel sharedInstance].appRegistry registerHomeAppRecord:homeAppRecord];
  [self moveAppToVisible:homeAppRecord];
}

#pragma mark - EXAppBrowserController

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord
{
  [self _foregroundAppRecord:appRecord];
}

- (void)toggleMenu
{
  [self setIsMenuVisible:!_isMenuVisible];
}

- (void)setIsMenuVisible:(BOOL)isMenuVisible
{
  if (!_menuViewController) {
    _menuViewController = [[EXMenuViewController alloc] init];
  }
  
  // TODO: ben: can this be more robust?
  // some third party libs (and core RN) often just look for the root VC and present random crap from it.
  if (self.presentedViewController && self.presentedViewController != _menuViewController) {
    [self.presentedViewController dismissViewControllerAnimated:NO completion:nil];
  }
  
  if (isMenuVisible != _isMenuVisible) {
    _isMenuVisible = isMenuVisible;
    if (_isMenuVisible) {
      [self presentViewController:_menuViewController animated:NO completion:nil];
    } else {
      [_menuViewController dismissViewControllerAnimated:NO completion:nil];
    }
  }
}

- (void)showDiagnostics
{
  EXHomeDiagnosticsViewController *vcDiagnostics = [[EXHomeDiagnosticsViewController alloc] init];
  [self setIsMenuVisible:NO];
  [self presentViewController:vcDiagnostics animated:NO completion:nil];
}

- (void)showQRReader
{
  [self moveHomeToVisible];
  [[self _getHomeAppManager] showQRReader];
}

- (void)moveHomeToVisible
{
  [self setIsMenuVisible:NO];
  [[EXKernel sharedInstance] moveAppToVisible:[EXKernel sharedInstance].appRegistry.homeAppRecord];
}

- (void)refreshVisibleApp
{
  // this is different from Util.reload()
  // because it can work even on an errored app record (e.g. with no manifest, or with no running bridge).
  [self setIsMenuVisible:NO];
  NSURL *urlToRefresh = [EXKernel sharedInstance].visibleApp.appLoader.manifestUrl;
  [[EXKernel sharedInstance] createNewAppWithUrl:urlToRefresh initialProps:nil];
}

- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(NSDictionary *)manifest
{
  [[self _getHomeAppManager] addHistoryItemWithUrl:manifestUrl manifest:manifest];
}

- (void)getHistoryUrlForExperienceId:(NSString *)experienceId completion:(void (^)(NSString *))completion
{
  return [[self _getHomeAppManager] getHistoryUrlForExperienceId:experienceId completion:completion];
}

- (void)setIsNuxFinished:(BOOL)isFinished
{
  [[NSUserDefaults standardUserDefaults] setBool:isFinished forKey:kEXHomeIsNuxFinishedDefaultsKey];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

- (BOOL)isNuxFinished
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kEXHomeIsNuxFinishedDefaultsKey];
}

- (void)appDidFinishLoadingSuccessfully:(EXKernelAppRecord *)appRecord
{
  // show nux if needed
  if (!self.isNuxFinished
      && appRecord == [EXKernel sharedInstance].visibleApp
      && appRecord != [EXKernel sharedInstance].appRegistry.homeAppRecord
      && !self.isMenuVisible) {
    [self setIsMenuVisible:YES];
  }
}

#pragma mark - internal

- (void)_foregroundAppRecord:(EXKernelAppRecord *)appRecord
{
  UIViewController *viewControllerToShow = appRecord.viewController;
  if (viewControllerToShow != self.contentViewController) {
    if (self.contentViewController) {
      [self.contentViewController willMoveToParentViewController:nil];
      [self.contentViewController.view removeFromSuperview];
      [self.contentViewController didMoveToParentViewController:nil];
    }
    
    if (viewControllerToShow) {
      [viewControllerToShow willMoveToParentViewController:self];
      [self.view addSubview:viewControllerToShow.view];
      [viewControllerToShow didMoveToParentViewController:self];
    }
    
    self.contentViewController = viewControllerToShow;
    [self.view setNeedsLayout];
    [[EXKernel sharedInstance] appDidBecomeVisible:appRecord];
  }
}

- (EXHomeAppManager *)_getHomeAppManager
{
  return (EXHomeAppManager *)[EXKernel sharedInstance].appRegistry.homeAppRecord.appManager;
}

- (void)_maybeResetNuxState
{
  // used by appetize: optionally disable nux
  BOOL disableNuxDefaultsValue = [[NSUserDefaults standardUserDefaults] boolForKey:kEXHomeDisableNuxDefaultsKey];
  if (disableNuxDefaultsValue) {
    [self setIsNuxFinished:YES];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXHomeDisableNuxDefaultsKey];
  }
}

@end

NS_ASSUME_NONNULL_END
