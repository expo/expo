// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "EXAppLoadingView.h"
#import "EXAppLoadingManager.h"
#import "EXFileDownloader.h"
#import "EXAppViewController.h"
#import "EXReactAppManager.h"
#import "EXErrorView.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
#import "EXKernelUtil.h"
#import "EXScreenOrientationManager.h"
#import "EXShellManager.h"

#define EX_INTERFACE_ORIENTATION_USE_MANIFEST 0

NS_ASSUME_NONNULL_BEGIN

@interface EXAppViewController () <EXReactAppManagerUIDelegate, EXKernelAppLoaderDelegate, EXErrorViewDelegate>

@property (nonatomic, assign) BOOL isLoading;
@property (nonatomic, strong) UIView *contentView;
@property (nonatomic, weak) EXKernelAppRecord *appRecord;
@property (nonatomic, strong) EXAppLoadingView *loadingView;
@property (nonatomic, strong) EXErrorView *errorView;
@property (nonatomic, strong) NSTimer *viewTestTimer;
@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations; // override super

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
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  _loadingView = [[EXAppLoadingView alloc] initUsingSplash:[self _usesSplashScreen]];
  [self.view addSubview:_loadingView];
  _appRecord.appManager.delegate = self;
  self.isLoading = YES;
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  if (_appRecord && _appRecord.status == kEXKernelAppRecordStatusNew) {
    _appRecord.appLoader.delegate = self;
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
    _loadingView.frame = self.view.bounds;
    [_loadingView setNeedsLayout];
  }
  if (_contentView) {
    _contentView.frame = self.view.bounds;
  }
}

#pragma mark - Public

- (void)maybeShowError:(NSError *)error
{
  self.isLoading = NO;
  BOOL isNetworkError = ([error.domain isEqualToString:(NSString *)kCFErrorDomainCFNetwork] ||
                         [error.domain isEqualToString:EXNetworkErrorDomain]);
    if (isNetworkError) {
      // show a human-readable reachability error
      dispatch_async(dispatch_get_main_queue(), ^{
        [self _showErrorWithType:kEXFatalErrorTypeLoading error:error];
      });
    } else if ([error.domain isEqualToString:@"JSServer"] && [_appRecord.appManager enablesDeveloperTools]) {
      // RCTRedBox already handled this
    } else if ([error.domain rangeOfString:RCTErrorDomain].length > 0 && [_appRecord.appManager enablesDeveloperTools]) {
      // RCTRedBox already handled this
    } else {
      // TODO: ben: handle other error cases
      // also, can test for (error.code == kCFURLErrorNotConnectedToInternet)
      dispatch_async(dispatch_get_main_queue(), ^{
        [self _showErrorWithType:kEXFatalErrorTypeException error:error];
      });
    }
}

- (void)reload
{
  [_appRecord.appManager rebuildBridge];
}

- (void)refresh
{
  if (_viewTestTimer) {
    [_viewTestTimer invalidate];
    _viewTestTimer = nil;
  }
  self.isLoading = YES;
  [_appRecord.appLoader request];
}

- (void)appDidBecomeVisible
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self _enforceDesiredDeviceOrientation];
  });
  [_appRecord.appManager appDidBecomeVisible];
}

- (void)appDidBackground
{
  [_appRecord.appManager appDidBackground];
}

#pragma mark - EXKernelAppLoaderDelegate

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest
{
  _loadingView.manifest = manifest;
  dispatch_async(dispatch_get_main_queue(), ^{
    [self _enforceDesiredDeviceOrientation];
    [self reload];
  });
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress
{
  dispatch_async(dispatch_get_main_queue(), ^{
    _loadingView.progress = ([progress.done floatValue] / [progress.total floatValue]);
  });
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)data
{
  if (_appRecord.appManager.status == kEXReactAppManagerStatusBridgeLoading) {
    [_appRecord.appManager appLoaderFinished];
  }
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didFailWithError:(NSError *)error
{
  if (_appRecord.appManager.status == kEXReactAppManagerStatusBridgeLoading) {
    [_appRecord.appManager appLoaderFailedWithError:error];
  }
  [self maybeShowError:error];
}

#pragma mark - EXReactAppManagerDelegate

- (void)reactAppManagerIsReadyForLoad:(EXReactAppManager *)appManager
{
  UIView *reactView = appManager.rootView;
  reactView.frame = self.view.bounds;
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
  
  if (_viewTestTimer) {
    [_viewTestTimer invalidate];
    _viewTestTimer = nil;
  }
  _viewTestTimer = [NSTimer scheduledTimerWithTimeInterval:0.02
                                                    target:self
                                                  selector:@selector(_checkAppFinishedLoading:)
                                                  userInfo:nil
                                                   repeats:YES];
}

- (void)reactAppManager:(EXReactAppManager *)appManager failedToLoadJavaScriptWithError:(NSError *)error
{
  EXAssertMainThread();
  [self maybeShowError:error];
}

- (void)reactAppManagerDidInvalidate:(EXReactAppManager *)appManager
{
  if (_viewTestTimer) {
    [_viewTestTimer invalidate];
    _viewTestTimer = nil;
  }
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
  if (_errorView && _contentView == _errorView) {
    // already showing, just update
    _errorView.type = type;
    _errorView.error = error;
  } {
    [_contentView removeFromSuperview];
    if (!_errorView) {
      _errorView = [[EXErrorView alloc] initWithFrame:self.view.bounds];
      _errorView.delegate = self;
    }
    _errorView.type = type;
    _errorView.error = error;
    _contentView = _errorView;
    [self.view addSubview:_contentView];
  }
}

- (void)setIsLoading:(BOOL)isLoading
{
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

- (BOOL)_usesSplashScreen
{
  if (_appRecord == [EXKernel sharedInstance].appRegistry.homeAppRecord) {
    // home always uses splash
    return YES;
  } else {
    // most shell apps use splash unless overridden
    // TODO: disable if this is a different appManager but still run in a shell context.
    return [EXShellManager sharedInstance].isShell && !([EXShellManager sharedInstance].isSplashScreenDisabled);
  }
}

- (void)_checkAppFinishedLoading:(NSTimer *)timer
{
  // When root view has been filled with something, there are two cases:
  //   1. AppLoading was never mounted, in which case we hide the loading indicator immediately
  //   2. AppLoading was mounted, in which case we wait till it is unmounted to hide the loading indicator
  if ([_appRecord.appManager rootView] &&
      [_appRecord.appManager rootView].subviews.count > 0 &&
      [_appRecord.appManager rootView].subviews.firstObject.subviews.count > 0) {
    EXAppLoadingManager *appLoading = [_appRecord.appManager appLoadingManagerInstance];
    if (!appLoading || !appLoading.started || appLoading.finished) {
      self.isLoading = NO;
      [_viewTestTimer invalidate];
      _viewTestTimer = nil;
    }
  }
}

@end

NS_ASSUME_NONNULL_END
