// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "EXAppDelegate.h"
#import "EXAppViewController.h"
#import "EXHomeAppManager.h"
#import "EXKernel.h"
#import "EXAppLoader.h"
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
@property (nonatomic, assign) BOOL isAnimatingAppTransition;
@property (nonatomic, strong, nullable) NSNumber *orientationBeforeShowingMenu;

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

/**
 * Overrides UIViewController's method that returns interface orientations that the view controller supports.
 * If EXMenuViewController is currently shown we want to use its supported orientations so the UI rotates
 * when we open the dev menu while in the unsupported orientation.
 * Otherwise, returns interface orientations supported by the current experience.
 */
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  return _isMenuVisible ? [_menuViewController supportedInterfaceOrientations] : [self.contentViewController supportedInterfaceOrientations];
}

/**
 * Same case as above with `supportedInterfaceOrientations` method.
 * If we don't override this, we can get incorrect orientation while changing device orientation when the dev menu is visible.
 */
- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
  return _isMenuVisible ? [_menuViewController preferredInterfaceOrientationForPresentation] : [self.contentViewController preferredInterfaceOrientationForPresentation];
}

#pragma mark - EXViewController

- (void)createRootAppAndMakeVisible
{
  EXHomeAppManager *homeAppManager = [[EXHomeAppManager alloc] init];
  EXAppLoader *homeAppLoader = [[EXAppLoader alloc] initWithLocalManifest:[EXHomeAppManager bundledHomeManifest]];
  EXKernelAppRecord *homeAppRecord = [[EXKernelAppRecord alloc] initWithAppLoader:homeAppLoader appManager:homeAppManager];
  [[EXKernel sharedInstance].appRegistry registerHomeAppRecord:homeAppRecord];
  [self moveAppToVisible:homeAppRecord];
}

#pragma mark - EXAppBrowserController

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord
{
  [self _foregroundAppRecord:appRecord];

  // When foregrounding the app record we want to add it to the history to handle the edge case
  // where a user opened a project, then went to home and cleared history, then went back to a
  // the already open project.
  [self addHistoryItemWithUrl:appRecord.appLoader.manifestUrl manifest:appRecord.appLoader.manifest];

}

- (void)toggleMenuWithCompletion:(void (^ _Nullable)(void))completion
{
  [self setIsMenuVisible:!_isMenuVisible completion:completion];
}

/**
 * Sets the visibility of the dev menu and attempts to rotate the UI according to interface orientations supported by the view controller that is on top.
 */
- (void)setIsMenuVisible:(BOOL)isMenuVisible completion:(void (^ _Nullable)(void))completion
{
  if (!_menuViewController) {
    _menuViewController = [[EXMenuViewController alloc] init];
  }
  if (isMenuVisible != _isMenuVisible) {
    _isMenuVisible = isMenuVisible;

    if (isMenuVisible) {
      // We need to force the device to use portrait orientation as the dev menu doesn't support landscape.
      // However, when removing it, we should set it back to the orientation from before showing the dev menu.
      _orientationBeforeShowingMenu = [[UIDevice currentDevice] valueForKey:@"orientation"];
      [[UIDevice currentDevice] setValue:@(UIInterfaceOrientationPortrait) forKey:@"orientation"];
    } else {
      // Restore the original orientation that had been set before the dev menu was displayed.
      [[UIDevice currentDevice] setValue:_orientationBeforeShowingMenu forKey:@"orientation"];
    }
    
    // Ask the system to rotate the UI to device orientation that we've just set to fake value (see previous line of code).
    [UIViewController attemptRotationToDeviceOrientation];
    
    if (isMenuVisible) {
      // Add menu view controller as a child of the root view controller.
      [_menuViewController willMoveToParentViewController:self];
      [_menuViewController.view setFrame:self.view.frame];
      [self.view addSubview:_menuViewController.view];
      [_menuViewController didMoveToParentViewController:self];
    } else {
      // Detach menu view controller from the root view controller.
      [_menuViewController willMoveToParentViewController:nil];
      [_menuViewController.view removeFromSuperview];
      [_menuViewController didMoveToParentViewController:nil];
    }
  }
  if (completion) {
    completion();
  }
}

- (BOOL)isMenuVisible
{
  return _isMenuVisible;
}

- (void)showQRReader
{
  [self moveHomeToVisible];
  [[self _getHomeAppManager] showQRReader];
}

- (void)moveHomeToVisible
{
  __weak typeof(self) weakSelf = self;
  [self setIsMenuVisible:NO completion:^{
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf moveAppToVisible:[EXKernel sharedInstance].appRegistry.homeAppRecord];
      
      if (strongSelf.isMenuVisible) {
        [strongSelf setIsMenuVisible:NO completion:nil];
      }
    }
  }];
}

// this is different from Util.reload()
// because it can work even on an errored app record (e.g. with no manifest, or with no running bridge).
- (void)reloadVisibleApp
{
  if (_isMenuVisible) {
    [self setIsMenuVisible:NO completion:nil];
  }

  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  [[EXKernel sharedInstance] logAnalyticsEvent:@"RELOAD_EXPERIENCE" forAppRecord:visibleApp];
  NSURL *urlToRefresh = visibleApp.appLoader.manifestUrl;

  // Unregister visible app record so all modules get destroyed.
  [[[EXKernel sharedInstance] appRegistry] unregisterAppWithRecord:visibleApp];

  // Create new app record.
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
    [self setIsMenuVisible:YES completion:nil];
  }
}

#pragma mark - internal

- (void)_foregroundAppRecord:(EXKernelAppRecord *)appRecord
{
  if (_isAnimatingAppTransition) {
    return;
  }
  EXAppViewController *viewControllerToShow = appRecord.viewController;
  EXAppViewController *viewControllerToHide;
  if (viewControllerToShow != self.contentViewController) {
    _isAnimatingAppTransition = YES;
    if (self.contentViewController) {
      viewControllerToHide = (EXAppViewController *)self.contentViewController;
    }
    if (viewControllerToShow) {
      [viewControllerToShow willMoveToParentViewController:self];
      [self.view addSubview:viewControllerToShow.view];
      [viewControllerToShow foregroundControllers];
    }

    __weak typeof(self) weakSelf = self;
    void (^transitionFinished)(void) = ^{
      __strong typeof(weakSelf) strongSelf = weakSelf;
      if (strongSelf) {
        if (viewControllerToHide) {
          // backgrounds and then dismisses all modals that are presented by the app
          [viewControllerToHide backgroundControllers];
          [viewControllerToHide dismissViewControllerAnimated:NO completion:nil];
          [viewControllerToHide willMoveToParentViewController:nil];
          [viewControllerToHide.view removeFromSuperview];
          [viewControllerToHide didMoveToParentViewController:nil];
        }
        if (viewControllerToShow) {
          [viewControllerToShow didMoveToParentViewController:strongSelf];
          strongSelf.contentViewController = viewControllerToShow;
        }
        [strongSelf.view setNeedsLayout];
        strongSelf.isAnimatingAppTransition = NO;
        if (strongSelf.delegate) {
          [strongSelf.delegate viewController:strongSelf didNavigateAppToVisible:appRecord];
        }
      }
    };
    
    BOOL animated = (viewControllerToHide && viewControllerToShow);
    if (animated) {
      if (viewControllerToHide.contentView) {
        viewControllerToHide.contentView.transform = CGAffineTransformIdentity;
        viewControllerToHide.contentView.alpha = 1.0f;
      }
      if (viewControllerToShow.contentView) {
        viewControllerToShow.contentView.transform = CGAffineTransformMakeScale(1.1f, 1.1f);
        viewControllerToShow.contentView.alpha = 0;
      }
      [UIView animateWithDuration:0.3f animations:^{
        if (viewControllerToHide.contentView) {
          viewControllerToHide.contentView.transform = CGAffineTransformMakeScale(0.95f, 0.95f);
          viewControllerToHide.contentView.alpha = 0.5f;
        }
        if (viewControllerToShow.contentView) {
          viewControllerToShow.contentView.transform = CGAffineTransformIdentity;
          viewControllerToShow.contentView.alpha = 1.0f;
        }
      } completion:^(BOOL finished) {
        transitionFinished();
      }];
    } else {
      transitionFinished();
    }
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
