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
#import "EXScreenOrientationManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController () <EXAppBrowserController>

@property (nonatomic, weak) UIViewController *contentViewController;
@property (nonatomic, strong) EXMenuViewController *menuViewController;
@property (nonatomic, assign) BOOL isMenuVisible;

@end

@implementation EXRootViewController

- (instancetype)init
{
  if (self = [super init]) {
    [EXKernel sharedInstance].browserController = self;
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor yellowColor];

  EXHomeAppManager *homeAppManager = [[EXHomeAppManager alloc] init];
  EXKernelAppLoader *homeAppLoader = [[EXKernelAppLoader alloc] initWithLocalManifest:[EXHomeAppManager bundledHomeManifest]];
  EXKernelAppRecord *homeAppRecord = [[EXKernelAppRecord alloc] initWithAppLoader:homeAppLoader appManager:homeAppManager];
  [[EXKernel sharedInstance].appRegistry registerHomeAppRecord:homeAppRecord];
  [self moveAppToVisible:homeAppRecord];
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  if (_contentViewController) {
    _contentViewController.view.frame = CGRectMake(0, 0, self.view.bounds.size.width, self.view.bounds.size.height);
  }
}

- (BOOL)shouldAutorotate
{
  return YES;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  return [[EXKernel sharedInstance].serviceRegistry.screenOrientationManager supportedInterfaceOrientationsForVisibleApp];
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

- (void)getHistoryUrlForExperienceId:(NSString *)experienceId completion:(void (^)(NSString *))completion
{
  EXHomeAppManager *homeAppManager = (EXHomeAppManager *)[EXKernel sharedInstance].appRegistry.homeAppRecord.appManager;
  return [homeAppManager getHistoryUrlForExperienceId:experienceId completion:completion];
}

- (void)moveHomeToVisible
{
  [self setIsMenuVisible:NO];
  [[EXKernel sharedInstance] moveAppToVisible:[EXKernel sharedInstance].appRegistry.homeAppRecord];
}

- (void)refreshVisibleApp
{
  [self setIsMenuVisible:NO];
  NSURL *urlToRefresh = [EXKernel sharedInstance].visibleApp.appLoader.manifestUrl;
  [[EXKernel sharedInstance] createNewAppWithUrl:urlToRefresh initialProps:nil];
}

#pragma mark - internal

- (void)_foregroundAppRecord:(EXKernelAppRecord *)appRecord
{
  UIViewController *viewControllerToShow = appRecord.viewController;
  if (viewControllerToShow != _contentViewController) {
    if (_contentViewController) {
      [_contentViewController willMoveToParentViewController:nil];
      [_contentViewController.view removeFromSuperview];
      [_contentViewController didMoveToParentViewController:nil];
    }
    
    if (viewControllerToShow) {
      [viewControllerToShow willMoveToParentViewController:self];
      [self.view addSubview:viewControllerToShow.view];
      [viewControllerToShow didMoveToParentViewController:self];
    }
    
    _contentViewController = viewControllerToShow;
    [self.view setNeedsLayout];
    [[EXKernel sharedInstance] appDidBecomeVisible:appRecord];
  }
}

@end

NS_ASSUME_NONNULL_END
