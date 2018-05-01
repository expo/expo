// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXScreenOrientationManager.h"
#import "EXViewController.h"
#import "ExpoKit.h"
#import "EXShellManager.h"

@interface EXViewController ()

@end

@implementation EXViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor whiteColor];
  [self createRootAppAndMakeVisible];
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  if (_contentViewController) {
    _contentViewController.view.frame = CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height);
  }
}

- (UIRectEdge)edgesForExtendedLayout
{
  return UIRectEdgeNone;
}

- (BOOL)extendedLayoutIncludesOpaqueBars
{
  return YES;
}

- (void)createRootAppAndMakeVisible
{
  NSURL *standaloneAppUrl = [NSURL URLWithString:[EXShellManager sharedInstance].shellManifestUrl];
  NSDictionary *initialProps = [[EXKernel sharedInstance] initialAppPropsFromLaunchOptions:[ExpoKit sharedInstance].launchOptions];
  EXKernelAppRecord *appRecord = [[EXKernel sharedInstance] createNewAppWithUrl:standaloneAppUrl
                                                                   initialProps:initialProps];
  
  UIViewController *viewControllerToShow = (UIViewController *)appRecord.viewController;

  [viewControllerToShow willMoveToParentViewController:self];
  [self.view addSubview:viewControllerToShow.view];
  [viewControllerToShow didMoveToParentViewController:self];
    
  _contentViewController = viewControllerToShow;
  [self.view setNeedsLayout];
  if (_delegate) {
    [_delegate viewController:self didNavigateAppToVisible:appRecord];
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

@end
