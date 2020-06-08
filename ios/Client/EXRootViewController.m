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
#import "EXRootViewController.h"
#import "EXDevMenuManager.h"

NSString * const kEXHomeDisableNuxDefaultsKey = @"EXKernelDisableNuxDefaultsKey";
NSString * const kEXHomeIsNuxFinishedDefaultsKey = @"EXHomeIsNuxFinishedDefaultsKey";

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController () <EXAppBrowserController>

@property (nonatomic, assign) BOOL isAnimatingAppTransition;

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

- (void)showQRReader
{
  [self moveHomeToVisible];
  [[self _getHomeAppManager] showQRReader];
}

- (void)moveHomeToVisible
{
  [[EXDevMenuManager sharedInstance] close];
  [self moveAppToVisible:[EXKernel sharedInstance].appRegistry.homeAppRecord];
}

// this is different from Util.reload()
// because it can work even on an errored app record (e.g. with no manifest, or with no running bridge).
- (void)reloadVisibleApp
{
  [[EXDevMenuManager sharedInstance] close];

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
      && appRecord != [EXKernel sharedInstance].appRegistry.homeAppRecord) {
    [[EXDevMenuManager sharedInstance] open];
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
