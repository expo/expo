// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXViewController.h"
#import "EXErrorView.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"

#import "RCTDevLoadingView.h"
#import "RCTRootView.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXViewController () <EXErrorViewDelegate>

@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicator;
@property (nonatomic, strong) EXErrorView *errorView;

@property (nonatomic, strong) EXKernelReactAppManager *appManager;

@end

@implementation EXViewController

#pragma mark - Lifecycle

- (instancetype)initWithLaunchOptions:(NSDictionary *)launchOptions
{
  if (self = [super init]) {
    _appManager = [[EXKernelReactAppManager alloc] initWithLaunchOptions:launchOptions];
    _appManager.delegate = self;
    [[EXKernel sharedInstance] registerRootExponentViewController:self];
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  _loadingIndicator = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
  _loadingIndicator.hidesWhenStopped = YES;
}

- (BOOL)shouldAutorotate
{
  return YES;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  return [[EXKernel sharedInstance] supportedInterfaceOrientationsForForegroundTask];
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

- (void)loadReactApplication
{
  [_appManager reload];
}

- (void)setIsLoading:(BOOL)isLoading
{
  _isLoading = isLoading;
  if (_isLoading) {
    [_loadingIndicator startAnimating];
  } else {
    [_loadingIndicator stopAnimating];
  }
}

#pragma mark - EXReactAppManagerDelegate

- (void)reactAppManagerDidInitApp:(EXReactAppManager *)appManager
{
  UIView *reactView = appManager.reactRootView;
  reactView.frame = self.view.bounds;
  reactView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  reactView.backgroundColor = [UIColor clearColor];

  [_contentView removeFromSuperview];
  _contentView = reactView;
  [self.view addSubview:_contentView];
  [reactView becomeFirstResponder];
  
  self.isLoading = YES;
}

- (void)reactAppManagerDidDestroyApp:(EXReactAppManager *)appManager
{
  
}

- (void)reactAppManager:(EXReactAppManager *)appManager failedToDownloadBundleWithError:(NSError *)error
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

#pragma mark - Delegate

- (void)errorViewDidSelectRetry:(EXErrorView *)errorView
{
  // if the app launched with some options, clear them-- this is no longer a new launch,
  // and it's possible that these options were what caused the error (e.g. a bad initial url)
  _appManager.launchOptions = nil;
  
  [self loadReactApplication];
}

@end

NS_ASSUME_NONNULL_END
