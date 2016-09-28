// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXRootViewController.h"
#import "EXDevMenuViewController.h"
#import "EXErrorView.h"
#import "EXExceptionHandler.h"
#import "EXFatalHandler.h"
#import "EXFileDownloader.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXKernelModuleProvider.h"
#import "EXLog.h"
#import "EXShellManager.h"
#import "EXVersionManager.h"

#import "RCTDevLoadingView.h"
#import "RCTRootView.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController () <EXErrorViewDelegate>

@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicator;
@property (nonatomic, strong) UIView *contentView;
@property (nonatomic, assign) BOOL isLoading;
@property (nonatomic, strong) NSDictionary *launchOptions;
@property (nonatomic, strong) EXErrorView *errorView;
@property (nonnull, strong) RCTBridge *bridge;
@property (nonatomic, strong) EXVersionManager *versionManager;
@property (nonnull, strong) EXJavaScriptResource *jsResource;

@end

@implementation EXRootViewController

#pragma mark - Lifecycle

- (instancetype)initWithLaunchOptions:(NSDictionary *)launchOptions
{
  if (self = [super init]) {
    _launchOptions = launchOptions;
    _isLoading = NO;
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];

  // Display the launch screen behind the React view so that the React view appears to seamlessly load
  NSString *loadingNib = ([EXShellManager sharedInstance].isShell) ? @"LaunchScreenShell" : @"LaunchScreen";
  NSArray *views = [[NSBundle mainBundle] loadNibNamed:loadingNib owner:self options:nil];
  UIView *placeholder = views.firstObject;
  placeholder.frame = self.view.bounds;
  placeholder.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self.view addSubview:placeholder];
  
  // The launch screen contains a loading indicator
  _loadingIndicator = (UIActivityIndicatorView *)[placeholder viewWithTag:1];
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

- (void)applicationWillEnterForeground
{
  if (!_isLoading && ![_contentView isKindOfClass:[RCTRootView class]]) {
    [self loadReactApplication];
  }
}

- (void)loadReactApplication
{
  EXAssertMainThread();
  
  if (_versionManager) {
    [_versionManager invalidate];
    _versionManager = nil;
  }
  [[EXKernel sharedInstance].bridgeRegistry unregisterKernelBridge];
  [self _stopObservingBridgeNotifications];
  [_bridge invalidate];
  _bridge = nil;
  _jsResource = nil;
  
  [RCTDevLoadingView setEnabled:NO];
  
  NSDictionary *initialProps = nil;
  if ([EXShellManager sharedInstance].isShell) {
    initialProps = @{
                     @"shell": @YES,
                     @"shellManifestUrl": [EXShellManager sharedInstance].shellManifestUrl,
                     };
  }

  _versionManager = [[EXVersionManager alloc] initWithFatalHandler:handleFatalReactError logFunction:EXGetKernelRCTLogFunction() logThreshold:RCTLogLevelInfo];
  _bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:_launchOptions];
  RCTRootView *reactView = [[RCTRootView alloc] initWithBridge:_bridge
                                                    moduleName:@"ExponentApp"
                                             initialProperties:initialProps];
  reactView.frame = self.view.bounds;
  reactView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  reactView.backgroundColor = [UIColor clearColor];
  
  [_contentView removeFromSuperview];
  _contentView = reactView;
  [self.view addSubview:_contentView];
  [reactView becomeFirstResponder];

  self.isLoading = YES;
  [[EXKernel sharedInstance].bridgeRegistry registerKernelBridge:_bridge];
  [self _startObservingBridgeNotifications];
}

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

#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  NSString *kernelNgrokUrl = BUILD_MACHINE_KERNEL_NGROK_URL;
  NSString *kernelPath = @"exponent.bundle?dev=true&platform=ios";
  if (kernelNgrokUrl.length) {
    return [NSURL URLWithString:[NSString stringWithFormat:@"%@/%@", kernelNgrokUrl, kernelPath]];
  } else {
    return [NSURL URLWithString:[NSString stringWithFormat:@"http://%@:8081/%@", BUILD_MACHINE_LOCAL_HOSTNAME, kernelPath]];
  }
#else
  return [NSURL URLWithString:@"https://exp.host/~exponent/kernel"];
#endif
}

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  static NSString * const EXExceptionHandlerKey = @"EXExceptionHandler";
  EXExceptionHandler *exceptionHandler = [[EXExceptionHandler alloc] initWithBridge:bridge];
  RCTExceptionsManager *exceptionsManager = [[RCTExceptionsManager alloc] initWithDelegate:exceptionHandler];
  objc_setAssociatedObject(exceptionsManager, &EXExceptionHandlerKey, exceptionHandler, OBJC_ASSOCIATION_RETAIN_NONATOMIC);

  NSMutableArray *modules = [EXKernelModuleProvider(_launchOptions) mutableCopy];
  [modules addObject:exceptionsManager];
  
  return modules;
}

- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback
{
  _jsResource = [[EXJavaScriptResource alloc] initWithBundleName:kEXKernelBundleResourceName remoteUrl:bridge.bundleURL];
  
  EXCachedResourceBehavior cacheBehavior = [[NSUserDefaults standardUserDefaults] boolForKey:kEXSkipCacheUserDefaultsKey] ?
    kEXCachedResourceNoCache :
    kEXCachedResourceUseCacheImmediately;
  
  [_jsResource loadResourceWithBehavior:cacheBehavior successBlock:^(NSData * _Nonnull sourceData) {
    loadCallback(nil, sourceData, sourceData.length);
  } errorBlock:^(NSError * _Nonnull error) {
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
    loadCallback(error, nil, 0);
  }];
}

#pragma mark - Internal

- (void)setIsLoading:(BOOL)isLoading
{
  _isLoading = isLoading;
  if (_isLoading) {
    [_loadingIndicator startAnimating];
  } else {
    [_loadingIndicator stopAnimating];
  }
}

- (void)_handleJavaScriptStartLoadingEvent:(NSNotification *)notification
{
  [self performSelectorOnMainThread:@selector(_handleJavaScriptStartLoadingEventMainThread:) withObject:notification waitUntilDone:YES];
}

- (void)_handleJavaScriptLoadEvent:(NSNotification *)notification
{
  [self performSelectorOnMainThread:@selector(_handleJavaScriptLoadEventMainThread:) withObject:notification waitUntilDone:YES];
}

- (void)_handleBridgeForegroundEvent:(NSNotification * _Nullable)notification
{
  [_versionManager bridgeDidForeground];
}

- (void)_handleBridgeBackgroundEvent:(NSNotification * _Nullable)notification
{
  [_versionManager bridgeDidBackground];
}

- (void)_handleJavaScriptStartLoadingEventMainThread:(NSNotification *)notification
{
  EXAssertMainThread();
  self.isLoading = YES;
}

- (void)_handleJavaScriptLoadEventMainThread:(NSNotification *)notification
{
  EXAssertMainThread();
  self.isLoading = NO;
  if ([notification.name isEqualToString:RCTJavaScriptDidLoadNotification]) {
    [_versionManager bridgeFinishedLoading];
    [self _handleBridgeForegroundEvent:nil];
  } else if ([notification.name isEqualToString:RCTJavaScriptDidFailToLoadNotification]) {
    NSError *error = (notification.userInfo) ? notification.userInfo[@"error"] : nil;
    [self showErrorWithType:kEXFatalErrorTypeLoading error:error];
  }
}

- (void)_startObservingBridgeNotifications
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptStartLoadingEvent:)
                                               name:RCTJavaScriptWillStartLoadingNotification
                                             object:_bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:_bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:_bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleBridgeForegroundEvent:)
                                               name:kEXKernelBridgeDidForegroundNotification
                                             object:_bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleBridgeBackgroundEvent:)
                                               name:kEXKernelBridgeDidBackgroundNotification
                                             object:_bridge];
}

- (void)_stopObservingBridgeNotifications
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTJavaScriptWillStartLoadingNotification object:_bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTJavaScriptDidLoadNotification object:_bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTJavaScriptDidFailToLoadNotification object:_bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:kEXKernelBridgeDidForegroundNotification object:_bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:kEXKernelBridgeDidBackgroundNotification object:_bridge];
}

#pragma mark - Delegate

- (void)errorViewDidSelectRetry:(EXErrorView *)errorView
{
  // if the app launched with some options, clear them-- this is no longer a new launch,
  // and it's possible that these options were what caused the error (e.g. a bad initial url)
  _launchOptions = nil;

  [self loadReactApplication];
}

@end

NS_ASSUME_NONNULL_END
