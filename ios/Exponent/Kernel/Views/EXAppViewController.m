// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "EXAnalytics.h"
#import "EXAppLoader.h"
#import "EXAppLoadingView.h"
#import "EXAppViewController.h"
#import "EXEnvironment.h"
#import "EXErrorRecoveryManager.h"
#import "EXErrorView.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXReactAppManager.h"
#import "EXScreenOrientationManager.h"
#import "EXUpdatesManager.h"

#import <React/RCTUtils.h>

#define EX_INTERFACE_ORIENTATION_USE_MANIFEST 0

// when we encounter an error and auto-refresh, we may actually see a series of errors.
// we only want to trigger refresh once, so we debounce refresh on a timer.
const CGFloat kEXAutoReloadDebounceSeconds = 0.1;

// in development only, some errors can happen before we even start loading
// (e.g. certain packager errors, such as an invalid bundle url)
// and we want to make sure not to cover the error with a loading view or other chrome.
const CGFloat kEXDevelopmentErrorCoolDownSeconds = 0.1;

NS_ASSUME_NONNULL_BEGIN

@interface EXAppViewController ()
  <EXReactAppManagerUIDelegate, EXAppLoaderDelegate, EXErrorViewDelegate>

@property (nonatomic, assign) BOOL isLoading;
@property (nonatomic, assign) BOOL isBridgeAlreadyLoading;
@property (nonatomic, weak) EXKernelAppRecord *appRecord;
@property (nonatomic, strong) EXAppLoadingView *loadingView;
@property (nonatomic, strong) EXErrorView *errorView;
@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations; // override super
@property (nonatomic, strong) NSTimer *tmrAutoReloadDebounce;
@property (nonatomic, strong) NSDate *dtmLastFatalErrorShown;
@property (nonatomic, strong) NSMutableArray<UIViewController *> *backgroundedControllers;

@end

@implementation EXAppViewController

@synthesize supportedInterfaceOrientations = _supportedInterfaceOrientations;

#pragma mark - Lifecycle

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record
{
  if (self = [super init]) {
    _appRecord = record;
    _supportedInterfaceOrientations = EX_INTERFACE_ORIENTATION_USE_MANIFEST;
  }
  return self;
}

- (void)dealloc
{
  [self _invalidateRecoveryTimer];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor whiteColor];

  _loadingView = [[EXAppLoadingView alloc] initWithAppRecord:_appRecord];
  [self.view addSubview:_loadingView];
  _appRecord.appManager.delegate = self;
  self.isLoading = YES;
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  if (_appRecord && _appRecord.status == kEXKernelAppRecordStatusNew) {
    _appRecord.appLoader.delegate = self;
    _appRecord.appLoader.dataSource = _appRecord.appManager;
    [self refresh];
  }
}

- (BOOL)shouldAutorotate
{
  return YES;
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  if (_loadingView) {
    _loadingView.frame = CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height);
  }
  if (_contentView) {
    _contentView.frame = CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height);
  }
}

#pragma mark - Public

- (void)maybeShowError:(NSError *)error
{
  self.isLoading = NO;
  if ([self _willAutoRecoverFromError:error]) {
    return;
  }
  if (error && ![error isKindOfClass:[NSError class]]) {
#if DEBUG
    NSAssert(NO, @"AppViewController error handler was called on an object that isn't an NSError");
#endif
    return;
  }
  NSString *domain = (error && error.domain) ? error.domain : @"";
  BOOL isNetworkError = ([domain isEqualToString:(NSString *)kCFErrorDomainCFNetwork] || [domain isEqualToString:EXNetworkErrorDomain]);

  if (isNetworkError) {
    // show a human-readable reachability error
    dispatch_async(dispatch_get_main_queue(), ^{
      [self _showErrorWithType:kEXFatalErrorTypeLoading error:error];
    });
  } else if ([domain isEqualToString:@"JSServer"] && [_appRecord.appManager enablesDeveloperTools]) {
    // RCTRedBox already handled this
  } else if ([domain rangeOfString:RCTErrorDomain].length > 0 && [_appRecord.appManager enablesDeveloperTools]) {
    // RCTRedBox already handled this
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self _showErrorWithType:kEXFatalErrorTypeException error:error];
    });
  }
}

- (void)_rebuildBridge
{
  [self _invalidateRecoveryTimer];
  [[EXKernel sharedInstance] logAnalyticsEvent:@"LOAD_EXPERIENCE" forAppRecord:_appRecord];
  [_appRecord.appManager rebuildBridge];
}

- (void)refresh
{
  self.isLoading = YES;
  self.isBridgeAlreadyLoading = NO;
  [self _invalidateRecoveryTimer];
  [_appRecord.appLoader request];
}

- (void)reloadFromCache
{
  self.isLoading = YES;
  self.isBridgeAlreadyLoading = NO;
  [self _invalidateRecoveryTimer];
  [_appRecord.appLoader requestFromCache];
}

- (void)appStateDidBecomeActive
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self _enforceDesiredDeviceOrientation];
  });
  [_appRecord.appManager appStateDidBecomeActive];
}

- (void)appStateDidBecomeInactive
{
  [_appRecord.appManager appStateDidBecomeInactive];
}

- (void)_rebuildBridgeWithLoadingViewManifest:(NSDictionary *)manifest
{
  if (!self.isBridgeAlreadyLoading) {
    self.isBridgeAlreadyLoading = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
      self->_loadingView.manifest = manifest;
      [self _enforceDesiredDeviceOrientation];
      [self _rebuildBridge];
    });
  }
}

- (void)foregroundControllers
{
  if (_backgroundedControllers != nil) {
    __block UIViewController *parentController = self;
    
    [_backgroundedControllers enumerateObjectsUsingBlock:^(UIViewController * _Nonnull viewController, NSUInteger idx, BOOL * _Nonnull stop) {
      [parentController presentViewController:viewController animated:NO completion:nil];
      parentController = viewController;
    }];
    
    _backgroundedControllers = nil;
  }
}

- (void)backgroundControllers
{
  UIViewController *childController = [self presentedViewController];
  
  if (childController != nil) {
    if (_backgroundedControllers == nil) {
      _backgroundedControllers = [NSMutableArray new];
    }
    
    while (childController != nil) {
      [_backgroundedControllers addObject:childController];
      childController = childController.presentedViewController;
    }
  }
}

#pragma mark - EXAppLoaderDelegate

- (void)appLoader:(EXAppLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest
{
  if ([EXKernel sharedInstance].browserController) {
    [[EXKernel sharedInstance].browserController addHistoryItemWithUrl:appLoader.manifestUrl manifest:manifest];
  }
  [self _rebuildBridgeWithLoadingViewManifest:manifest];
}

- (void)appLoader:(EXAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_loadingView updateStatusWithProgress:progress];
  });
}

- (void)appLoader:(EXAppLoader *)appLoader didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)data
{
  [self _rebuildBridgeWithLoadingViewManifest:manifest];
  if (self->_appRecord.appManager.status == kEXReactAppManagerStatusBridgeLoading) {
    [self->_appRecord.appManager appLoaderFinished];
  }
}

- (void)appLoader:(EXAppLoader *)appLoader didFailWithError:(NSError *)error
{
  if (_appRecord.appManager.status == kEXReactAppManagerStatusBridgeLoading) {
    [_appRecord.appManager appLoaderFailedWithError:error];
  }
  [self maybeShowError:error];
}

- (void)appLoader:(EXAppLoader *)appLoader didResolveUpdatedBundleWithManifest:(NSDictionary * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error
{
  [[EXKernel sharedInstance].serviceRegistry.updatesManager notifyApp:_appRecord ofDownloadWithManifest:manifest isNew:!isFromCache error:error];
}

#pragma mark - EXReactAppManagerDelegate

- (void)reactAppManagerIsReadyForLoad:(EXReactAppManager *)appManager
{
  UIView *reactView = appManager.rootView;
  reactView.frame = CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height);
  reactView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  reactView.backgroundColor = [UIColor clearColor];
  
  [_contentView removeFromSuperview];
  _contentView = reactView;
  [self.view addSubview:_contentView];
  [self.view sendSubviewToBack:_contentView];

  [reactView becomeFirstResponder];
}

- (void)reactAppManagerStartedLoadingJavaScript:(EXReactAppManager *)appManager
{
  EXAssertMainThread();
  self.isLoading = YES;
}

- (void)reactAppManagerFinishedLoadingJavaScript:(EXReactAppManager *)appManager
{
  EXAssertMainThread();
  self.isLoading = NO;
  if ([EXKernel sharedInstance].browserController) {
    [[EXKernel sharedInstance].browserController appDidFinishLoadingSuccessfully:_appRecord];
  }
}

- (void)reactAppManager:(EXReactAppManager *)appManager failedToLoadJavaScriptWithError:(NSError *)error
{
  EXAssertMainThread();
  [self maybeShowError:error];
}

- (void)reactAppManagerDidInvalidate:(EXReactAppManager *)appManager
{

}

- (void)errorViewDidSelectRetry:(EXErrorView *)errorView
{
  [self refresh];
}

#pragma mark - orientation

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  if (_supportedInterfaceOrientations != EX_INTERFACE_ORIENTATION_USE_MANIFEST) {
    return _supportedInterfaceOrientations;
  }
  if (_appRecord.appLoader.manifest) {
    NSString *orientationConfig = _appRecord.appLoader.manifest[@"orientation"];
    if ([orientationConfig isEqualToString:@"portrait"]) {
      // lock to portrait
      return UIInterfaceOrientationMaskPortrait;
    } else if ([orientationConfig isEqualToString:@"landscape"]) {
      // lock to landscape
      return UIInterfaceOrientationMaskLandscape;
    }
  }
  // no config or default value: allow autorotation
  return UIInterfaceOrientationMaskAllButUpsideDown;
}

- (void)setSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  _supportedInterfaceOrientations = supportedInterfaceOrientations;
  [self _enforceDesiredDeviceOrientation];
}

- (void)traitCollectionDidChange:(nullable UITraitCollection *)previousTraitCollection {
  [super traitCollectionDidChange:previousTraitCollection];
  if ((self.traitCollection.verticalSizeClass != previousTraitCollection.verticalSizeClass)
      || (self.traitCollection.horizontalSizeClass != previousTraitCollection.horizontalSizeClass)) {
    [[EXKernel sharedInstance].serviceRegistry.screenOrientationManager handleScreenOrientationChange:self.traitCollection];
  }
}

- (void)_enforceDesiredDeviceOrientation
{
  RCTAssertMainQueue();
  UIInterfaceOrientationMask mask = [self supportedInterfaceOrientations];
  UIDeviceOrientation currentOrientation = [[UIDevice currentDevice] orientation];
  UIInterfaceOrientation newOrientation = UIInterfaceOrientationUnknown;
  switch (mask) {
    case UIInterfaceOrientationMaskPortrait:
      if (!UIDeviceOrientationIsPortrait(currentOrientation)) {
        newOrientation = UIInterfaceOrientationPortrait;
      }
      break;
    case UIInterfaceOrientationMaskPortraitUpsideDown:
      newOrientation = UIInterfaceOrientationPortraitUpsideDown;
      break;
    case UIInterfaceOrientationMaskLandscape:
      if (!UIDeviceOrientationIsLandscape(currentOrientation)) {
        newOrientation = UIInterfaceOrientationLandscapeLeft;
      }
      break;
    case UIInterfaceOrientationMaskLandscapeLeft:
      newOrientation = UIInterfaceOrientationLandscapeLeft;
      break;
    case UIInterfaceOrientationMaskLandscapeRight:
      newOrientation = UIInterfaceOrientationLandscapeRight;
      break;
    case UIInterfaceOrientationMaskAllButUpsideDown:
      if (currentOrientation == UIDeviceOrientationFaceDown) {
        newOrientation = UIInterfaceOrientationPortrait;
      }
      break;
    default:
      break;
  }
  if (newOrientation != UIInterfaceOrientationUnknown) {
    [[UIDevice currentDevice] setValue:@(newOrientation) forKey:@"orientation"];
  }
  [UIViewController attemptRotationToDeviceOrientation];
}

#pragma mark - Internal

- (void)_showErrorWithType:(EXFatalErrorType)type error:(nullable NSError *)error
{
  EXAssertMainThread();
  _dtmLastFatalErrorShown = [NSDate date];
  if (_errorView && _contentView == _errorView) {
    // already showing, just update
    _errorView.type = type;
    _errorView.error = error;
  } {
    [_contentView removeFromSuperview];
    if (!_errorView) {
      _errorView = [[EXErrorView alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height)];
      _errorView.delegate = self;
      _errorView.appRecord = _appRecord;
    }
    _errorView.type = type;
    _errorView.error = error;
    _contentView = _errorView;
    [self.view addSubview:_contentView];
    [[EXAnalytics sharedInstance] logErrorVisibleEvent];
  }
}

- (void)setIsLoading:(BOOL)isLoading
{
  if ([_appRecord.appManager enablesDeveloperTools] && _dtmLastFatalErrorShown) {
    if ([_dtmLastFatalErrorShown timeIntervalSinceNow] >= -kEXDevelopmentErrorCoolDownSeconds) {
      // we just showed a fatal error very recently, do not begin loading.
      // this can happen in some cases where react native sends the 'started loading' notif
      // in spite of a packager error.
      return;
    }
  }
  _isLoading = isLoading;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (isLoading) {
      self.loadingView.hidden = NO;
      [self.view bringSubviewToFront:self.loadingView];
    } else {
      self.loadingView.hidden = YES;
    }
  });
}

#pragma mark - error recovery

- (BOOL)_willAutoRecoverFromError:(NSError *)error
{
  if (![_appRecord.appManager enablesDeveloperTools]) {
    BOOL shouldRecover = [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdShouldReloadOnError:_appRecord.experienceId];
    if (shouldRecover) {
      [self _invalidateRecoveryTimer];
      _tmrAutoReloadDebounce = [NSTimer scheduledTimerWithTimeInterval:kEXAutoReloadDebounceSeconds
                                                                target:self
                                                              selector:@selector(refresh)
                                                              userInfo:nil
                                                               repeats:NO];
    }
    return shouldRecover;
  }
  return NO;
}

- (void)_invalidateRecoveryTimer
{
  if (_tmrAutoReloadDebounce) {
    [_tmrAutoReloadDebounce invalidate];
    _tmrAutoReloadDebounce = nil;
  }
}

@end

NS_ASSUME_NONNULL_END
