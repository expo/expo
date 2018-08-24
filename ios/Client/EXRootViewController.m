// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "EXAppDelegate.h"
#import "EXAppViewController.h"
#import "EXButtonView.h"
#import "EXHomeAppManager.h"
#import "EXHomeDiagnosticsViewController.h"
#import "EXKernel.h"
#import "EXAppLoader.h"
#import "EXKernelAppRecord.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelDevKeyCommands.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelServiceRegistry.h"
#import "EXMenuGestureRecognizer.h"
#import "EXMenuViewController.h"
#import "EXRootViewController.h"
#import "EXMenuWindow.h"

NSString * const kEXHomeDisableNuxDefaultsKey = @"EXKernelDisableNuxDefaultsKey";
NSString * const kEXHomeIsNuxFinishedDefaultsKey = @"EXHomeIsNuxFinishedDefaultsKey";

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController () <EXAppBrowserController>

@property (nonatomic, strong) EXMenuViewController *menuViewController;
@property (nonatomic, assign) BOOL isMenuVisible;
@property (nonatomic, assign) BOOL isAnimatingMenu;
@property (nonatomic, assign) BOOL isAnimatingAppTransition;
@property (nonatomic, strong) EXButtonView *btnMenu;
@property (nonatomic, strong, nullable) EXMenuWindow *menuWindow;

@end

@implementation EXRootViewController

- (instancetype)init
{
  if (self = [super init]) {
    [EXKernel sharedInstance].browserController = self;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_updateMenuButtonBehavior)
                                                 name:kEXKernelDidChangeMenuBehaviorNotification
                                               object:nil];
    [self _maybeResetNuxState];
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  _btnMenu = [[EXButtonView alloc] init];
  _btnMenu.hidden = YES;
  [self.view addSubview:_btnMenu];
  EXMenuGestureRecognizer *menuGestureRecognizer = [[EXMenuGestureRecognizer alloc] initWithTarget:self action:@selector(_onMenuGestureRecognized:)];
  [((EXAppDelegate *)[UIApplication sharedApplication].delegate).window addGestureRecognizer:menuGestureRecognizer];
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  _btnMenu.frame = CGRectMake(0, 0, 48.0f, 48.0f);
  _btnMenu.center = CGPointMake(self.view.frame.size.width - 36.0f, self.view.frame.size.height - 72.0f);
  [self.view bringSubviewToFront:_btnMenu];
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
}

- (void)toggleMenuWithCompletion:(void (^ _Nullable)(void))completion
{
  [self setIsMenuVisible:!_isMenuVisible completion:completion];
}

- (void)setIsMenuVisible:(BOOL)isMenuVisible completion:(void (^ _Nullable)(void))completion
{
  if (!_menuViewController) {
    _menuViewController = [[EXMenuViewController alloc] init];
  }
  if (isMenuVisible != _isMenuVisible) {
    if (!_isAnimatingMenu) {
      _isMenuVisible = isMenuVisible;
      [self _animateMenuToVisible:_isMenuVisible completion:completion];
    }
  } else {
    completion();
  }
}

- (void)showDiagnostics
{
  __weak typeof(self) weakSelf = self;
  [self setIsMenuVisible:NO completion:^{
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      EXHomeDiagnosticsViewController *vcDiagnostics = [[EXHomeDiagnosticsViewController alloc] init];
      [strongSelf presentViewController:vcDiagnostics animated:NO completion:nil];
    }
  }];
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

- (void)refreshVisibleApp
{
  // this is different from Util.reload()
  // because it can work even on an errored app record (e.g. with no manifest, or with no running bridge).
  [self setIsMenuVisible:NO completion:nil];
  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  [[EXKernel sharedInstance] logAnalyticsEvent:@"RELOAD_EXPERIENCE" forAppRecord:visibleApp];
  NSURL *urlToRefresh = visibleApp.appLoader.manifestUrl;
  [[EXKernel sharedInstance] createNewAppWithUrl:urlToRefresh initialProps:nil];
}

- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(NSDictionary *)manifest
{
  [[self _getHomeAppManager] addHistoryItemWithUrl:manifestUrl manifest:manifest];
}

- (void)getIsValidHomeManifestToOpen:(NSDictionary *)manifest manifestUrl:(NSURL *) manifestUrl completion:(void (^)(BOOL isValid))completion
{
  [[self _getHomeAppManager] getIsValidHomeManifestToOpen:manifest manifestUrl:(NSURL *) manifestUrl completion:completion];
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
  
  // check button availability when any new app loads
  [self _updateMenuButtonBehavior];
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
          [viewControllerToHide dismissViewControllerAnimated:NO completion:^{
            [viewControllerToHide willMoveToParentViewController:nil];
            [viewControllerToHide.view removeFromSuperview];
            [viewControllerToHide didMoveToParentViewController:nil];
          }];
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

- (void)_animateMenuToVisible:(BOOL)visible completion:(void (^ _Nullable)(void))completion
{
  _isAnimatingMenu = YES;
  __weak typeof(self) weakSelf = self;
  if (visible) {
    [_menuViewController willMoveToParentViewController:self];
    
    if (_menuWindow == nil) {
      _menuWindow = [[EXMenuWindow alloc] init];
    }
    
    [_menuWindow setFrame:self.view.frame];
    [_menuWindow addSubview:_menuViewController.view];
    [_menuWindow makeKeyAndVisible];
    
    _menuViewController.view.alpha = 0.0f;
    _menuViewController.view.transform = CGAffineTransformMakeScale(1.1f, 1.1f);
    [UIView animateWithDuration:0.1f animations:^{
      self.menuViewController.view.alpha = 1.0f;
      self.menuViewController.view.transform = CGAffineTransformIdentity;
    } completion:^(BOOL finished) {
      __strong typeof(weakSelf) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.isAnimatingMenu = NO;
        [strongSelf.menuViewController didMoveToParentViewController:self];
        if (completion) {
          completion();
        }
      }
    }];
  } else {
    _menuViewController.view.alpha = 1.0f;
    [UIView animateWithDuration:0.1f animations:^{
      self.menuViewController.view.alpha = 0.0f;
    } completion:^(BOOL finished) {
      __strong typeof(weakSelf) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.isAnimatingMenu = NO;
        [strongSelf.menuViewController willMoveToParentViewController:nil];
        [strongSelf.menuViewController.view removeFromSuperview];
        [strongSelf.menuViewController didMoveToParentViewController:nil];
        strongSelf.menuWindow = nil;
        if (completion) {
          completion();
        }
      }
    }];
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

- (void)_updateMenuButtonBehavior
{
  BOOL shouldShowButton = [[EXKernelDevKeyCommands sharedInstance] isLegacyMenuButtonAvailable];
  dispatch_async(dispatch_get_main_queue(), ^{
    self.btnMenu.hidden = !shouldShowButton;
  });
}

- (void)_onMenuGestureRecognized:(EXMenuGestureRecognizer *)sender
{
  if (sender.state == UIGestureRecognizerStateEnded) {
    [[EXKernel sharedInstance] switchTasks];
  }
}

@end

NS_ASSUME_NONNULL_END
