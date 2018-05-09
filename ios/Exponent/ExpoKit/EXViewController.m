// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXScreenOrientationManager.h"
#import "EXViewController.h"
#import "ExpoKit.h"
#import "EXShellManager.h"
#import "EXUtil.h"

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

- (void)presentViewController:(UIViewController *)viewControllerToPresent animated:(BOOL)flag completion:(void (^_Nullable)(void))completion
{
  // @tsapeta: some RN's modules try to present modal view controllers on EXRootViewController
  // but for the correct behavior they should be presented on the innermost controller in EXAppViewController hierarchy,
  // so we just pass this call to the current controller.
  if ([viewControllerToPresent isKindOfClass:[UIAlertController class]]
      || [viewControllerToPresent isKindOfClass:[UIDocumentMenuViewController class]]
      || [viewControllerToPresent isKindOfClass:[UIImagePickerController class]]
      || [viewControllerToPresent isKindOfClass:[UIActivityViewController class]]) {
    [[[ExpoKit sharedInstance] currentViewController] presentViewController:viewControllerToPresent animated:flag completion:completion];
  } else {
    [super presentViewController:viewControllerToPresent animated:flag completion:completion];
  }
}

@end
