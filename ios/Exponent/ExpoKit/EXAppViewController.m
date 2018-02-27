// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "EXFileDownloader.h"
#import "EXAppViewController.h"
#import "EXReactAppManager.h"
#import "EXErrorView.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
#import "EXKernelUtil.h"
#import "EXShellManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXAppViewController () <EXReactAppManagerUIDelegate, EXKernelAppLoaderDelegate, EXErrorViewDelegate>

- (void)showErrorWithType:(EXFatalErrorType)type error: (nullable NSError *)error;

@property (nonatomic, assign) BOOL isLoading;
@property (nonatomic, strong) UIView *contentView;
@property (nonatomic, weak) EXKernelAppRecord *appRecord;

/* @property (nonatomic, strong) UIActivityIndicatorView *loadingIndicator;
 @property (nonatomic, strong) UIView *loadingView; */
@property (nonatomic, strong) EXErrorView *errorView;

@end

@implementation EXAppViewController

#pragma mark - Lifecycle

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record
{
  if (self = [super init]) {
    _appRecord = record;
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  // TODO: splash screen
  self.view.backgroundColor = [UIColor blueColor];
  
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
  [_appRecord.appManager reload];
}

- (void)refresh
{
  [_appRecord.appLoader request];
}

- (void)setIsLoading:(BOOL)isLoading
{
  _isLoading = isLoading;
  // TODO: splash
}

#pragma mark - EXKernelAppLoaderDelegate

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest
{
  // TODO: BEN
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress
{
  
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
  NSLog(@"err");
}

#pragma mark - EXReactAppManagerDelegate

- (void)reactAppManagerIsReadyForDisplay:(EXReactAppManager *)appManager
{
  UIView *reactView = appManager.rootView;
  reactView.frame = self.view.bounds;
  reactView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  reactView.backgroundColor = [UIColor clearColor];
  
  [_contentView removeFromSuperview];
  _contentView = reactView;
  [self.view addSubview:_contentView];
  [reactView becomeFirstResponder];
  
  self.isLoading = YES;
}

- (void)reactAppManagerDidInvalidate:(EXReactAppManager *)appManager
{
  
}

/* - (void)reactAppManager:(EXReactAppManager *)appManager failedToDownloadBundleWithError:(NSError *)error
{
  BOOL isNetworkError = ([error.domain isEqualToString:(NSString *)kCFErrorDomainCFNetwork] ||
                         [error.domain isEqualToString:EXNetworkErrorDomain]);
  if (isNetworkError &&
      error.code == kCFURLErrorNotConnectedToInternet) {
    // show a human-readable reachability error
    __weak typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      [weakSelf showErrorWithType:kEXFatalErrorTypeLoading error:error];
    });
  }
}

- (void)reactAppManagerStartedLoadingJavaScript:(EXReactAppManager *)appManager
{
  EXAssertMainThread();
  self.isLoading = YES;
}

- (void)reactAppManager:(EXReactAppManager *)appManager loadedJavaScriptWithProgress:(RCTLoadingProgress *)progress
{
}

- (void)reactAppManagerFinishedLoadingJavaScript:(EXReactAppManager *)appManager
{
  EXAssertMainThread();
  self.isLoading = NO;
}

- (void)reactAppManager:(EXReactAppManager *)appManager failedToLoadJavaScriptWithError:(NSError *)error
{
  EXAssertMainThread();
  self.isLoading = NO;
  [self showErrorWithType:kEXFatalErrorTypeLoading error:error];
}

- (void)reactAppManagerDidForeground:(EXReactAppManager *)appManager
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self _enforceKernelOrientation];
  });
} */

- (void)errorViewDidSelectRetry:(EXErrorView *)errorView
{
  // if the app launched with some options, clear them-- this is no longer a new launch,
  // and it's possible that these options were what caused the error (e.g. a bad initial url)
  // TODO: BEN _appManager.launchOptions = nil;
  
  [self refresh];
}

#pragma mark - Internal

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
}

@end

NS_ASSUME_NONNULL_END


