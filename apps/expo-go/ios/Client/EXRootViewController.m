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
@property (nonatomic, strong) NSURL *pendingInitialHomeURL;

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

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [self becomeFirstResponder];
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];
  [self resignFirstResponder];
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent * _Nullable)event
{
  [super motionEnded:motion withEvent:event];
  if (motion == UIEventSubtypeMotionShake && [DevMenuManager.shared getMotionGestureEnabled]) {
    [DevMenuManager.shared toggleMenu];
  }
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
  if (_pendingInitialHomeURL) {
    _homeViewController.initialURL = _pendingInitialHomeURL;
  }
  [self _showHomeViewController];
}

#pragma mark - Initial URL

- (void)setInitialHomeURL:(NSURL *)url
{
  _pendingInitialHomeURL = url;
  if (_homeViewController != nil) {
    _homeViewController.initialURL = url;
  }
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

  // Skip snack URLs - they often don't work properly when reopened from history
  NSURLComponents *components = [NSURLComponents componentsWithURL:manifestUrl resolvingAgainstBaseURL:NO];
  for (NSURLQueryItem *item in components.queryItems) {
    if ([item.name isEqualToString:@"snack"]) {
      return;
    }
  }

  NSString *appName = nil;
  NSString *iconUrl = nil;

  if ([manifest.rawManifestJSON[@"extra"] isKindOfClass:[NSDictionary class]]) {
    NSDictionary *extra = manifest.rawManifestJSON[@"extra"];
    if ([extra[@"expoClient"] isKindOfClass:[NSDictionary class]]) {
      NSDictionary *expoClient = extra[@"expoClient"];
      appName = expoClient[@"name"];
      iconUrl = expoClient[@"iconUrl"];
      if (!iconUrl && [expoClient[@"icon"] isKindOfClass:[NSString class]]) {
        iconUrl = expoClient[@"icon"];
      }
    }
  }

  if (!appName && manifest.rawManifestJSON[@"name"]) {
    appName = manifest.rawManifestJSON[@"name"];
  }

  if (!iconUrl && manifest.rawManifestJSON[@"iconUrl"]) {
    iconUrl = manifest.rawManifestJSON[@"iconUrl"];
  }
  if (!iconUrl && manifest.rawManifestJSON[@"icon"]) {
    iconUrl = manifest.rawManifestJSON[@"icon"];
  }
  if (!iconUrl && [manifest.rawManifestJSON[@"ios"] isKindOfClass:[NSDictionary class]]) {
    NSDictionary *iosConfig = manifest.rawManifestJSON[@"ios"];
    if (iosConfig[@"iconUrl"]) {
      iconUrl = iosConfig[@"iconUrl"];
    } else if (iosConfig[@"icon"]) {
      iconUrl = iosConfig[@"icon"];
    }
  }

  if (!appName) {
    appName = manifestUrl.absoluteString;
  }

  if (iconUrl && [iconUrl length] > 0) {
    NSURL *resolved = [NSURL URLWithString:iconUrl];
    if (resolved == nil || resolved.scheme == nil) {
      resolved = [NSURL URLWithString:iconUrl relativeToURL:manifestUrl];
    }
    iconUrl = resolved.absoluteString;
  }
  
  [[ExpoGoHomeBridge shared] addHistoryItemWithUrl:manifestUrl.absoluteString
                                              name:appName
                                           iconUrl:iconUrl];
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
  // Re-apply the default orientation after the app has been loaded (eq. after a reload)
  [self _applySupportedInterfaceOrientations];
}

#pragma mark - internal

- (void)_foregroundAppRecord:(EXKernelAppRecord *)appRecord
{
  [self _transitionToViewController:appRecord.viewController appRecord:appRecord];
}

- (void)_showHomeViewController
{
  [self _transitionToViewController:_homeViewController appRecord:nil];
}

- (void)_transitionToViewController:(UIViewController *)viewControllerToShow
                          appRecord:(nullable EXKernelAppRecord *)appRecord
{
  if (_isAnimatingAppTransition || viewControllerToShow == self.contentViewController) {
    return;
  }

  BOOL isShowingApp = appRecord != nil;
  if (isShowingApp) {
    _transitioningToViewController = viewControllerToShow;
  }

  _isAnimatingAppTransition = YES;

  UIViewController *viewControllerToHide = self.contentViewController;
  BOOL isHidingHome = (viewControllerToHide == _homeViewController);

  [self _insertChildViewController:viewControllerToShow];
  [self _applySupportedInterfaceOrientations];

  EX_WEAKIFY(self)
  void (^finalizeTransition)(void) = ^{
    EX_ENSURE_STRONGIFY(self)
    [self _detachChildViewController:viewControllerToHide isHidingHome:isHidingHome];
    [self _completeTransitionToViewController:viewControllerToShow appRecord:appRecord];
  };

  [self _animateTransitionFromViewController:viewControllerToHide
                            toViewController:viewControllerToShow
                                  completion:finalizeTransition];
}

- (void)_insertChildViewController:(UIViewController *)viewController
{
  if (!viewController) {
    return;
  }
  [self.view addSubview:viewController.view];
  [self addChildViewController:viewController];
}

- (void)_detachChildViewController:(UIViewController *)viewController isHidingHome:(BOOL)isHidingHome
{
  if (!viewController) {
    return;
  }

  if (!isHidingHome && [viewController isKindOfClass:[EXAppViewController class]]) {
    EXAppViewController *appVC = (EXAppViewController *)viewController;
    [appVC backgroundControllers];
    [appVC dismissViewControllerAnimated:NO completion:nil];
  }

  [viewController willMoveToParentViewController:nil];
  [viewController removeFromParentViewController];
  [viewController.view removeFromSuperview];
}

- (void)_completeTransitionToViewController:(UIViewController *)viewController
                                  appRecord:(nullable EXKernelAppRecord *)appRecord
{
  BOOL isShowingApp = appRecord != nil;

  if (viewController) {
    [viewController didMoveToParentViewController:self];
    self.contentViewController = viewController;

    NSLog(@"[DevMenu] _completeTransitionToViewController: isShowingApp=%d, reactHost=%@", isShowingApp, appRecord.appManager.reactHost ? @"YES" : @"NO");

    // Set configuration based on manifest (doesn't require reactHost)
    if (isShowingApp && appRecord.appLoader.manifest) {
      [[DevMenuManager shared] updateCurrentManifest:appRecord.appLoader.manifest manifestURL:appRecord.appLoader.manifestUrl];

      DevMenuConfiguration *config = [DevMenuManager shared].configuration;

      BOOL isDev = appRecord.appLoader.manifest.isDevelopmentMode || appRecord.appLoader.manifest.isUsingDeveloperTool;
      BOOL isSnack = [self _isSnackURL:appRecord.appLoader.manifestUrl];

      NSLog(@"[DevMenu] Configuration: isDev=%d, isSnack=%d", isDev, isSnack);

      if (!isDev) {
        config.showDebuggingTip = NO;
        config.showFastRefresh = NO;
        config.showPerformanceMonitor = NO;
        config.showElementInspector = NO;
        config.showRuntimeVersion = NO;
        config.showHostUrl = NO;
        config.showSystemSection = !isSnack;
        config.appNameOverride = isSnack ? @"Playground" : nil;
      } else {
        config.showDebuggingTip = YES;
        config.showFastRefresh = YES;
        config.showPerformanceMonitor = YES;
        config.showElementInspector = YES;
        config.showRuntimeVersion = YES;
        config.showHostUrl = NO;
        config.showSystemSection = YES;
        config.appNameOverride = nil;
      }
    }
  }

  if (isShowingApp) {
    [self.view setNeedsLayout];
  }

  _isAnimatingAppTransition = NO;
  _transitioningToViewController = nil;

  if (self.delegate) {
    [self.delegate viewController:self didNavigateAppToVisible:appRecord];
  }

  [self _applySupportedInterfaceOrientations];
}

- (void)_animateTransitionFromViewController:(UIViewController *)fromViewController
                            toViewController:(UIViewController *)toViewController
                                  completion:(void (^)(void))completion
{
  BOOL shouldAnimate = fromViewController != nil && toViewController != nil;
  if (!shouldAnimate) {
    completion();
    return;
  }

  fromViewController.view.alpha = 1.0f;
  toViewController.view.alpha = 0.0f;

  [UIView animateWithDuration:0.3f animations:^{
    fromViewController.view.alpha = 0.5f;
    toViewController.view.alpha = 1.0f;
  } completion:^(BOOL finished) {
    completion();
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

- (BOOL)_isSnackURL:(nullable NSURL *)url
{
  if (!url) {
    return NO;
  }
  NSString *query = [url query];
  return query && ([query containsString:@"snack"] || [query containsString:@"snack-channel"]);
}

@end

NS_ASSUME_NONNULL_END
