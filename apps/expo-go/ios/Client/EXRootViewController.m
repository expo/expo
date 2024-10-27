// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import <ExpoModulesCore/EXDefines.h>

#import "EXAppViewController.h"
#import "EXHomeAppManager.h"
#import "EXKernel.h"
#import "EXDevelopmentHomeLoader.h"
#import "EXKernelAppRecord.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelServiceRegistry.h"
#import "EXRootViewController.h"
#import "EXDevMenuManager.h"
#import "EXEmbeddedHomeLoader.h"
#import "EXBuildConstants.h"

@import ExpoScreenOrientation;

NSString * const kEXHomeDisableNuxDefaultsKey = @"EXKernelDisableNuxDefaultsKey";
NSString * const kEXHomeIsNuxFinishedDefaultsKey = @"EXHomeIsNuxFinishedDefaultsKey";

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController () <EXAppBrowserController>

@property (nonatomic, assign) BOOL isAnimatingAppTransition;
@property (nonatomic, weak) UIViewController *transitioningToViewController;

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

#pragma mark - Screen Orientation

- (BOOL)shouldAutorotate
{
  return YES;
}

/**
 * supportedInterfaceOrienation has to defined by the currently visible app (to support multiple apps with different settings),
 * but according to the iOS docs 'Typically, the system calls this method only on the root view controller of the window',
 * so we need to query the kernel about currently visible app and it's view controller settings
 */
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  // During app transition we want to return the orientation of the screen that will be shown. This makes sure
  // that the rotation animation starts as the new view controller is being shown.
  if (_isAnimatingAppTransition && _transitioningToViewController != nil) {
    return [_transitioningToViewController supportedInterfaceOrientations];
  }

  const UIInterfaceOrientationMask visibleAppSupportedInterfaceOrientations =
    [EXKernel sharedInstance]
      .visibleApp
      .viewController
      .supportedInterfaceOrientations;

  return visibleAppSupportedInterfaceOrientations;
}

#pragma mark - EXViewController

- (void)createRootAppAndMakeVisible
{
  EXHomeAppManager *homeAppManager = [[EXHomeAppManager alloc] init];

  // if developing, use development manifest from EXBuildConstants
  EXAbstractLoader *homeAppLoader;
  if ([EXBuildConstants sharedInstance].isDevKernel) {
    homeAppLoader = [[EXDevelopmentHomeLoader alloc] init];
  } else {
    homeAppLoader = [[EXEmbeddedHomeLoader alloc] init];
  }

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

- (void)showQRReader
{
  [self moveHomeToVisible];
  [[self _getHomeAppManager] showQRReader];
}

- (void)moveHomeToVisible
{
  [[EXDevMenuManager sharedInstance] close];
  [[self _getHomeAppManager] dispatchForegroundHomeEvent];
  [self moveAppToVisible:[EXKernel sharedInstance].appRegistry.homeAppRecord];
}

- (BOOL)_isHomeVisible {
  return [EXKernel sharedInstance].appRegistry.homeAppRecord == [EXKernel sharedInstance].visibleApp;
}

// this is different from Util.reload()
// because it can work even on an errored app record (e.g. with no manifest, or with no running bridge).
- (void)reloadVisibleApp
{
  if ([self _isHomeVisible]) {
    EXReactAppManager *homeAppManager = [EXKernel sharedInstance].appRegistry.homeAppRecord.appManager;
    [homeAppManager reloadApp];
    return;
  }

  [[EXDevMenuManager sharedInstance] close];

  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  NSURL *urlToRefresh = visibleApp.appLoader.manifestUrl;

  // Unregister visible app record so all modules get destroyed.
  [[[EXKernel sharedInstance] appRegistry] unregisterAppWithRecord:visibleApp];

  // Create new app record.
  [[EXKernel sharedInstance] createNewAppWithUrl:urlToRefresh initialProps:nil];
}

- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(EXManifestsManifest *)manifest
{
  [[self _getHomeAppManager] addHistoryItemWithUrl:manifestUrl manifest:manifest];
}

- (void)getHistoryUrlForScopeKey:(NSString *)scopeKey completion:(void (^)(NSString *))completion
{
  return [[self _getHomeAppManager] getHistoryUrlForScopeKey:scopeKey completion:completion];
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
      && appRecord != [EXKernel sharedInstance].appRegistry.homeAppRecord) {
    [[EXDevMenuManager sharedInstance] open];
  }

  // Re-apply the default orientation after the app has been loaded (eq. after a reload)
  [self _applySupportedInterfaceOrientations];
}

#pragma mark - internal

- (void)_foregroundAppRecord:(EXKernelAppRecord *)appRecord
{
  // Some transition is in progress
  if (_isAnimatingAppTransition) {
    return;
  }
  
  EXAppViewController *viewControllerToShow = appRecord.viewController;
  _transitioningToViewController = viewControllerToShow;
  
  // Tried to foreground the very same view controller
  if (viewControllerToShow == self.contentViewController) {
    return;
  }
  
  _isAnimatingAppTransition = YES;
  
  EXAppViewController *viewControllerToHide = (EXAppViewController *)self.contentViewController;
  
  if (viewControllerToShow) {
    [self.view addSubview:viewControllerToShow.view];
    [self addChildViewController:viewControllerToShow];
  }

  // Try transitioning to the interface orientation of the app before it is shown for smoother transitions
  [self _applySupportedInterfaceOrientations];

  EX_WEAKIFY(self)
  void (^finalizeTransition)(void) = ^{
    EX_ENSURE_STRONGIFY(self)
    if (viewControllerToHide) {
      // backgrounds and then dismisses all modals that are presented by the app
      [viewControllerToHide backgroundControllers];
      [viewControllerToHide dismissViewControllerAnimated:NO completion:nil];
      [viewControllerToHide willMoveToParentViewController:nil];
      [viewControllerToHide removeFromParentViewController];
      [viewControllerToHide.view removeFromSuperview];
    }
  
    if (viewControllerToShow) {
      [viewControllerToShow didMoveToParentViewController:self];
      self.contentViewController = viewControllerToShow;
    }
    
    [self.view setNeedsLayout];
    self.isAnimatingAppTransition = NO;
    self.transitioningToViewController = nil;
    if (self.delegate) {
      [self.delegate viewController:self didNavigateAppToVisible:appRecord];
    }
    [self _applySupportedInterfaceOrientations];
  };

  BOOL animated = (viewControllerToHide && viewControllerToShow);
  if (!animated) {
    return finalizeTransition();
  }
  
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
    finalizeTransition();
  }];
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

- (void)_applySupportedInterfaceOrientations
{
  if (@available(iOS 16, *)) {
    [self setNeedsUpdateOfSupportedInterfaceOrientations];
  } else {
    // On iOS < 16 we need to try to rotate to the desired orientation, which also
    // makes the view controller to update the supported orientations
    UIInterfaceOrientationMask orientationMask = [self supportedInterfaceOrientations];
    [ScreenOrientationRegistry.shared enforceDesiredDeviceOrientationWithOrientationMask:orientationMask];
  }
}

@end

NS_ASSUME_NONNULL_END
