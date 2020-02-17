#import "EXAppLoadingView.h"
#import "EXAppLoadingCancelView.h"
#import "EXAppLoadingProgressView.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXReactAppManager.h"
#import "EXResourceLoader.h"
#import "EXUtil.h"

#import "EXSplashScreenConfig.h"
#import "EXManifestBasedSplashScreenViewProvider.h"

#import <EXSplashScreen/EXSplashScreenService.h>
#import <EXConstants/EXConstantsService.h>
#import <React/RCTComponent.h>

@interface EXAppLoadingView () <EXAppLoadingCancelViewDelegate>

@property (nonatomic, assign) BOOL isHomeApp;
@property (nonatomic, assign) BOOL isStandaloneApp;

@property (nonatomic, weak) EXAppViewController *appViewController;
@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicatorFromNib;
@property (nonatomic, strong) UIView *loadingView;

/**
 * Responsible for showing progress and messages from loading JS bundle via bridge.
 * Only available in managed flow or HomeApp.
 */
@property (nonatomic, strong) EXAppLoadingProgressView *loadingProgressView;
/**
 * Only avaialble in managed flow.
 */
@property (nonatomic, strong) EXAppLoadingCancelView *loadingCancelView;

@end

@implementation EXAppLoadingView

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record
{
  if (self = [super init]) {
    _isHomeApp = record == [EXKernel sharedInstance].appRegistry.homeAppRecord;
    _isStandaloneApp = [EXEnvironment sharedEnvironment].isDetached;
    _appViewController = record.viewController;
    [self _setUpViews];
  }
  return self;
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
  _loadingView.frame = self.bounds;
  // TODO: @bbarthec handle SplashScreen unimodule's `setFrame`
  
  CGFloat progressHeight = 36.0f;
  if (@available(iOS 11.0, *)) {
    progressHeight += self.safeAreaInsets.bottom;
  }
  _loadingProgressView.frame = CGRectMake(0, self.bounds.size.height - progressHeight, self.bounds.size.width, progressHeight);
  if (!_isHomeApp && _isStandaloneApp && !_manifest && _loadingCancelView) {
    CGFloat vCancelY = CGRectGetMidY(self.bounds) - 64.0f;
    _loadingCancelView.frame = CGRectMake(0, vCancelY, self.bounds.size.width, self.bounds.size.height - vCancelY);
  }
}

- (void)setManifest:(NSDictionary *)manifest
{
  _manifest = manifest;
  [self _updateViewsWithManifest];
}

- (void)updateStatusWithProgress:(EXLoadingProgress *)progress
{
  [_loadingProgressView updateStatusWithProgress:progress];
  _loadingProgressView.hidden = !(progress.total.floatValue > 0.0f);
}

#pragma mark - internal

- (void)_setUpViews
{
  BOOL hasSplashScreen = NO;
  if (_isStandaloneApp) {
//    EXStandaloneSplashScreenViewProvider *splashScreenViewProvider = [[EXManifestBasedSplashScreenViewProvider alloc] init];
//    [EXSplashScreen ];
//
//    // Display the launch screen behind the React view so that the React view appears to seamlessly load
//    NSArray *views;
//    @try {
//      NSString *launchScreen = (NSString *)[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UILaunchStoryboardName"] ?: @"SplashScreen";
//      views = [[NSBundle mainBundle] loadNibNamed:launchScreen owner:self options:nil];
//    } @catch (NSException *_) {
//      DDLogWarn(@"Expo SplashScreen.xib is missing. Unexpected loading behavior may occur.");
//    }
//    if (views) {
//      self.loadingView = views.firstObject;
//      self.loadingView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
//      [self addSubview:self.loadingView];
//      _loadingIndicatorFromNib = (UIActivityIndicatorView *)[self.loadingView viewWithTag:1];
//      _loadingIndicatorFromNib.hidesWhenStopped = YES;
//      [_loadingIndicatorFromNib startAnimating];
//      hasSplashScreen = YES;
//    }
  }
  if (_isHomeApp) {
    _loadingProgressView = [EXAppLoadingProgressView new];
    _loadingProgressView.hidden = YES;
    [self addSubview:_loadingProgressView];
  }
  
//  if (!hasSplashScreen) {
//    self.loadingView = [[UIView alloc] init];
//    [self addSubview:_loadingView];
//    _loadingView.backgroundColor = [UIColor whiteColor];
//    if ([self _isCancelAvailable]) {
//      _vCancel = [[EXAppLoadingCancelView alloc] init];
//      _vCancel.delegate = self;
//      [self addSubview:_vCancel];
//    }
//  }
  

  [self setNeedsLayout];
  [self setNeedsDisplay];
}

/**
 * Only applicable to managed flow.
 * When manifest is ready - show SplashScreen from unimodule basing on configuration from manifest
 */
- (void)_updateViewsWithManifest
{
  if (!_manifest) {
    return;
  }
  
  // TODO: @bbarthec: not sure about it yet
  if (_isStandaloneOrHomeApp) {
    return;
  }
  
  EXSplashScreenConfig *splashScreenConfig = [EXSplashScreenConfig fromManifest:_manifest];
  EXManifestBasedSplashScreenViewProvider *splashScreenViewProvider = [[EXManifestBasedSplashScreenViewProvider alloc] initWithConfig:splashScreenConfig];
  [EXSplashScreenService.sharedInstance show:(UIViewController *)_appViewController
                                  resizeMode:splashScreenConfig.resizeMode
                    splashScreenViewProvider:splashScreenViewProvider
                             successCallback:^{}
                             failureCallback:^(NSString * _Nonnull message) {}];
  
  
  // TODO @bbarthec: here actual SplashScreen is being presented
  UIColor *backgroundColor = [UIColor whiteColor];
  
  _loadingView.backgroundColor = backgroundColor;
  [self bringSubviewToFront:_loadingProgressView];
}

- (BOOL)_isCancelAvailable
{
  return ([EXKernel sharedInstance].appRegistry.homeAppRecord != nil);
}

- (void)_hidePlaceholder
{
  // if we used splash from NSBundle, we didn't use a placeholder in the first place
  if (_isStandaloneOrHomeApp) {
    return;
  }
  UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    UM_ENSURE_STRONGIFY(self);
    if (self.loadingIndicatorFromNib) {
      [self.loadingIndicatorFromNib stopAnimating];
    }
    if (self.loadingCancelView) {
      self.loadingCancelView.hidden = YES;
    }
  });
}

#pragma mark - delegate

- (void)appLoadingCancelViewDidCancel:(EXAppLoadingCancelView *)view
{
  if ([EXKernel sharedInstance].browserController) {
    [[EXKernel sharedInstance].browserController moveHomeToVisible];
  }
}

@end
