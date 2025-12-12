// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import <ExpoModulesCore/EXDefines.h>

#import "EXAbstractLoader.h"
#import "EXAppViewController.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "EXKernelAppRegistry.h"
#import "EXRootViewController.h"
#import "EXDevMenu-Swift.h"
#import "EXUtil.h"


#import "Expo_Go-Swift.h"

#import <React/RCTBridge+Private.h>

@import ExpoScreenOrientation;

NSString * const kEXHomeDisableNuxDefaultsKey = @"EXKernelDisableNuxDefaultsKey";
NSString * const kEXHomeIsNuxFinishedDefaultsKey = @"EXHomeIsNuxFinishedDefaultsKey";
NSString * const kEXIsLocalNetworkAccessGrantedKey = @"EXIsLocalNetworkAccessGranted";

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController () <EXAppBrowserController>

@property (nonatomic, assign) BOOL isAnimatingAppTransition;
@property (nonatomic, weak) UIViewController *transitioningToViewController;
@property (nonatomic, readonly) BOOL isLocalNetworkAccessGranted;
@property (nonatomic, strong) HomeViewController *homeViewController;

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

- (BOOL)isLocalNetworkAccessGranted {
  if ([[NSUserDefaults standardUserDefaults] objectForKey:kEXIsLocalNetworkAccessGrantedKey] != nil) {
    return [[NSUserDefaults standardUserDefaults] boolForKey:kEXIsLocalNetworkAccessGrantedKey];
  } else {
    return NO;
  }
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
  _homeViewController = [[HomeViewController alloc] init];
  [self _showHomeViewController];
}

#pragma mark - EXAppBrowserController

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord
{
  if ([EXUtil isExpoHostedUrl:appRecord.appLoader.manifestUrl] || [self isLocalNetworkAccessGranted]) {
    [self foregroundApp:appRecord];
    return;
  }

  [EXLocalNetworkAccessManager requestAccessWithCompletion:^(BOOL success) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (success) {
        NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
        [userDefaults setBool:YES forKey:kEXIsLocalNetworkAccessGrantedKey];
        [self foregroundApp:appRecord];
      } else {
        [self createLocalNetworkDeniedAlert];
      }
    });
  }];
}

- (void)foregroundApp:(EXKernelAppRecord *)appRecord
{
  [self _foregroundAppRecord:appRecord];
}

- (void)createLocalNetworkDeniedAlert
{
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"Local network access required"
                                                                 message:@"Local network access has been denied. This permission is required to run projects in Expo Go. Enable \"Local Network\" for Expo Go from the Settings app."
                                                          preferredStyle:UIAlertControllerStyleAlert];
  UIAlertAction *okAction = [UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:nil];
  [alert addAction:okAction];
  [self presentViewController:alert animated:YES completion:nil];
}


- (void)moveHomeToVisible
{
  [DevMenuManager.shared hideMenu];
  [self _showHomeViewController];
}

- (BOOL)_isHomeVisible {
  return _homeViewController != nil && self.contentViewController == _homeViewController;
}

// this is different from Util.reload()
// because it can work even on an errored app record (e.g. with no manifest, or with no running bridge).
- (void)reloadVisibleApp
{
  if ([self _isHomeVisible]) {
    return;
  }

  [DevMenuManager.shared closeMenuWithCompletion:nil];

  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  NSURL *urlToRefresh = visibleApp.appLoader.manifestUrl;

  // Unregister visible app record so all modules get destroyed.
  [[[EXKernel sharedInstance] appRegistry] unregisterAppWithRecord:visibleApp];

  // Create new app record.
  [[EXKernel sharedInstance] createNewAppWithUrl:urlToRefresh initialProps:nil];
}

- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(EXManifestsManifest *)manifest
{
  if (!manifestUrl || !manifest) {
    return;
  }

  NSString *appName = nil;
  NSString *iconUrl = nil;

  if ([manifest.rawManifestJSON[@"extra"] isKindOfClass:[NSDictionary class]]) {
    NSDictionary *extra = manifest.rawManifestJSON[@"extra"];
    if ([extra[@"expoClient"] isKindOfClass:[NSDictionary class]]) {
      NSDictionary *expoClient = extra[@"expoClient"];
      appName = expoClient[@"name"];
      iconUrl = expoClient[@"iconUrl"];
    }
  }

  if (!appName && manifest.rawManifestJSON[@"name"]) {
    appName = manifest.rawManifestJSON[@"name"];
  }

  if (!appName) {
    appName = manifestUrl.absoluteString;
  }
  
  [[ExpoGoHomeBridge shared] addHistoryItemWithUrl:manifestUrl.absoluteString
                                              name:appName
                                           iconUrl:iconUrl];
}

- (void)getHistoryUrlForScopeKey:(NSString *)scopeKey completion:(void (^)(NSString *))completion
{
  if (completion) {
    completion(nil);
  }
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
  if (!self.isNuxFinished && appRecord == [EXKernel sharedInstance].visibleApp) {
    [DevMenuManager.shared openMenu];
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

  UIViewController *viewControllerToHide = self.contentViewController;
  BOOL isHidingHome = (viewControllerToHide == _homeViewController);

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
      if (!isHidingHome && [viewControllerToHide isKindOfClass:[EXAppViewController class]]) {
        EXAppViewController *appVC = (EXAppViewController *)viewControllerToHide;
        [appVC backgroundControllers];
        [appVC dismissViewControllerAnimated:NO completion:nil];
      }
      [viewControllerToHide willMoveToParentViewController:nil];
      [viewControllerToHide removeFromParentViewController];
      [viewControllerToHide.view removeFromSuperview];
    }
  
    if (viewControllerToShow) {
      [viewControllerToShow didMoveToParentViewController:self];
      self.contentViewController = viewControllerToShow;

      if (appRecord.appManager.reactHost) {
        [[DevMenuManager shared] updateCurrentBridge:[RCTBridge currentBridge]];
        [[DevMenuManager shared] updateCurrentManifest:appRecord.appLoader.manifest manifestURL:appRecord.appLoader.manifestUrl];
      }
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

  UIView *viewToHide = viewControllerToHide.view;
  UIView *viewToShow = viewControllerToShow.view;

  if (viewToHide) {
    viewToHide.alpha = 1.0f;
  }
  if (viewToShow) {
    viewToShow.alpha = 0;
  }

  [UIView animateWithDuration:0.3f animations:^{
    if (viewToHide) {
      viewToHide.alpha = 0.5f;
    }
    if (viewToShow) {
      viewToShow.alpha = 1.0f;
    }
  } completion:^(BOOL finished) {
    finalizeTransition();
  }];
}

- (void)_showHomeViewController
{
  if (_isAnimatingAppTransition) {
    return;
  }

  
  if (_homeViewController == self.contentViewController) {
    return;
  }

  _isAnimatingAppTransition = YES;

  UIViewController *viewControllerToHide = self.contentViewController;

  [self.view addSubview:_homeViewController.view];
  [self addChildViewController:_homeViewController];

  [self _applySupportedInterfaceOrientations];

  EX_WEAKIFY(self)
  void (^finalizeTransition)(void) = ^{
    EX_ENSURE_STRONGIFY(self)
    if (viewControllerToHide) {
      if ([viewControllerToHide isKindOfClass:[EXAppViewController class]]) {
        EXAppViewController *appVC = (EXAppViewController *)viewControllerToHide;
        [appVC backgroundControllers];
        [appVC dismissViewControllerAnimated:NO completion:nil];
      }
      [viewControllerToHide willMoveToParentViewController:nil];
      [viewControllerToHide removeFromParentViewController];
      [viewControllerToHide.view removeFromSuperview];
    }

    [self->_homeViewController didMoveToParentViewController:self];
    self.contentViewController = self->_homeViewController;

    self.isAnimatingAppTransition = NO;
    self.transitioningToViewController = nil;

    if (self.delegate) {
      [self.delegate viewController:self didNavigateAppToVisible:nil];
    }

    [self _applySupportedInterfaceOrientations];
  };

  BOOL animated = (viewControllerToHide != nil);
  if (!animated) {
    return finalizeTransition();
  }

  if (viewControllerToHide.view) {
    viewControllerToHide.view.alpha = 1.0f;
  }
  if (_homeViewController.view) {
    _homeViewController.view.alpha = 0;
  }

  [UIView animateWithDuration:0.3f animations:^{
    if (viewControllerToHide.view) {
      viewControllerToHide.view.alpha = 0.5f;
    }
    if (self->_homeViewController.view) {
      self->_homeViewController.view.alpha = 1.0f;
    }
  } completion:^(BOOL finished) {
    finalizeTransition();
  }];
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
