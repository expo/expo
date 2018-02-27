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
#import "EXKernelServiceRegistry.h"
#import "EXMenuViewController.h"
#import "EXRootViewController.h"
#import "EXScreenOrientationManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController () <EXAppBrowserController, EXMenuDelegate>

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
  
  // this class only exists in expo client
  // build an EXViewController pointing at @exponent/home
  // TODO: launchOptions
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

// TODO: ben: maybe these shouldn't live here?
// because ExpoKit won't have this controller.
// instead it should pass thru to foreground controller.
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  return [[EXKernel sharedInstance].serviceRegistry.screenOrientationManager supportedInterfaceOrientationsForForegroundExperience];
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

- (void)showDiagnostics
{
  EXHomeDiagnosticsViewController *vcDiagnostics = [[EXHomeDiagnosticsViewController alloc] init];
  [self setIsMenuVisible:NO];
  [self presentViewController:vcDiagnostics animated:NO completion:nil];
}

#pragma mark - EXMenuDelegate

- (void)menuViewControllerDidSelectHome:(EXMenuViewController *)menuVC
{
  [self setIsMenuVisible:NO];
  [[EXKernel sharedInstance] moveAppToVisible:[EXKernel sharedInstance].appRegistry.homeAppRecord];
}

- (void)menuViewControllerDidSelectRefresh:(EXMenuViewController *)menuVC
{
  [self setIsMenuVisible:NO];
  [[EXKernel sharedInstance].visibleApp.viewController refresh];
}

#pragma mark - internal

- (void)setIsMenuVisible:(BOOL)isMenuVisible
{
  if (!_menuViewController) {
    _menuViewController = [[EXMenuViewController alloc] init];
    _menuViewController.delegate = self;
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
