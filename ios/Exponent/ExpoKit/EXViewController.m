// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXScreenOrientationManager.h"
#import "EXViewController.h"
#import "EXShellManager.h"

@interface EXViewController ()

@end

@implementation EXViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
  [self createRootAppAndMakeVisible];
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  if (_contentViewController) {
    _contentViewController.view.frame = CGRectMake(0, 0, self.view.bounds.size.width, self.view.bounds.size.height);
  }
}

- (void)createRootAppAndMakeVisible
{
  NSURL *standaloneAppUrl = [NSURL URLWithString:[EXShellManager sharedInstance].shellManifestUrl];
  EXKernelAppRecord *appRecord = [[EXKernel sharedInstance] createNewAppWithUrl:standaloneAppUrl initialProps:@{}];
  
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
