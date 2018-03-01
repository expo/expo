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
#import "EXUtil.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXAppViewController () <EXReactAppManagerUIDelegate, EXKernelAppLoaderDelegate, EXErrorViewDelegate>

- (void)showErrorWithType:(EXFatalErrorType)type error: (nullable NSError *)error;

@property (nonatomic, assign) BOOL isLoading;
@property (nonatomic, strong) UIView *contentView;
@property (nonatomic, weak) EXKernelAppRecord *appRecord;
@property (nonatomic, strong) EXAppLoadingView *loadingView;
@property (nonatomic, strong) EXErrorView *errorView;
@property (nonatomic, strong) NSTimer *viewTestTimer;

@end

@implementation EXAppViewController

#pragma mark - Lifecycle

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record
{
  if (self = [super init]) {
    _appRecord = record;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appDidDisplay:) name:kEXKernelAppDidDisplay object:nil];
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

- (void)showErrorWithType:(EXFatalErrorType)type error:(nullable NSError *)error
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

#pragma mark - EXKernelAppLoaderDelegate

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest
{
  _loadingView.manifest = manifest;
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress
{
  // TODO: ben: pass to loading view
  dispatch_async(dispatch_get_main_queue(), ^{
    _loadingView.progress = ([progress.done floatValue] / [progress.total floatValue]);
  });
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)data
{
  // TODO: BEN:
  // dev --> hook up to RCTSource bundle progress, so does this method matter?
  // not dev --> hide loading screen and proceed with current logic
  dispatch_async(dispatch_get_main_queue(), ^{
    [self reload];
  });
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didFailWithError:(NSError *)error
{
  if (_appRecord.appManager.status == kEXReactAppManagerStatusBridgeLoading) {
    [_appRecord.appManager appLoaderFailedWithError:error];
  }
  BOOL isNetworkError = ([error.domain isEqualToString:(NSString *)kCFErrorDomainCFNetwork] ||
                         [error.domain isEqualToString:EXNetworkErrorDomain]);
  [EXUtil performSynchronouslyOnMainThread:^{
    if (isNetworkError) {
      // show a human-readable reachability error
      [self showErrorWithType:kEXFatalErrorTypeLoading error:error];
    } else {
      // TODO: ben: handle other error cases
      // also, can test for (error.code == kCFURLErrorNotConnectedToInternet)
      [self showErrorWithType:kEXFatalErrorTypeException error:error];
    }
  }];
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
  self.isLoading = NO;
  [self showErrorWithType:kEXFatalErrorTypeLoading error:error];
}

- (void)reactAppManagerDidInvalidate:(EXReactAppManager *)appManager
{
  
}

- (void)errorViewDidSelectRetry:(EXErrorView *)errorView
{
  [self refresh];
}

#pragma mark - Internal

- (void)setIsLoading:(BOOL)isLoading
{
  _isLoading = isLoading;
  if (!isLoading) {
    if (![self _usesSplashScreen]) {
      // If no splash screen is used, hide the loading here.
      // otherwise wait for `appDidDisplay` notif
      self.loadingView.hidden = YES;
    }
  }
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

- (void)_appDidDisplay:(NSNotification *)note
{
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      strongSelf.loadingView.hidden = YES;
    }
  });
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
      [[NSNotificationCenter defaultCenter] postNotificationName:kEXKernelAppDidDisplay object:self];
      [_viewTestTimer invalidate];
      _viewTestTimer = nil;
    }
  }
}

/*
 TODO: ben: orientation. should this be in a different class?
 // also, should be using orientationsForMyAppRecord rather than foregroundExperience
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  [EXKernel sharedInstance].serviceRegistry.screenOrientationManager supportedInterfaceOrientationsForForegroundExperience];
  return [super supportedInterfaceOrientations];
}
- (void)reactAppManagerDidForeground:(EXReactAppManager *)appManager
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self _enforceKernelOrientation];
  });
  
  - (void)_enforceKernelOrientation
  {
    EXAssertMainThread();
    UIInterfaceOrientationMask mask = [self supportedInterfaceOrientations];
    UIDeviceOrientation currentOrientation = [[UIDevice currentDevice] orientation];
    if (mask == UIInterfaceOrientationMaskLandscape && (currentOrientation == UIDeviceOrientationPortrait)) {
      [[UIDevice currentDevice] setValue:@(UIInterfaceOrientationLandscapeLeft) forKey:@"orientation"];
    } else if (mask == UIInterfaceOrientationMaskPortrait && (currentOrientation != UIDeviceOrientationPortrait)) {
      [[UIDevice currentDevice] setValue:@(UIDeviceOrientationPortrait) forKey:@"orientation"];
    }
    [UIViewController attemptRotationToDeviceOrientation];
  } */

@end

NS_ASSUME_NONNULL_END


