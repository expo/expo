#import "EXAppLoadingView.h"
#import "EXAppLoadingCancelView.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXReactAppManager.h"
#import "EXResourceLoader.h"
#import "EXUtil.h"

#import <EXConstants/EXConstantsService.h>
#import <React/RCTComponent.h>
#import <React/RCTImageSource.h>
#import <React/RCTImageView.h>

@interface EXAppLoadingView () // <EXAppLoadingCancelViewDelegate>

@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicatorFromNib;
@property (nonatomic, strong) UIView *loadingView;
//@property (nonatomic, assign) BOOL usesSplashFromNSBundle;
@property (nonatomic, strong) EXAppLoadingCancelView *vCancel;

@end

@implementation EXAppLoadingView

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record
{
  if (self = [super init]) {
//    _usesSplashFromNSBundle = [[self class] _recordUsesSplashScreenFromNSBundle:record];
    [self _setUpViews];
  }
  return self;
}

//- (void)setFrame:(CGRect)frame
//{
//  [super setFrame:frame];
//  _loadingView.frame = self.bounds;
//
//  if (!_usesSplashFromNSBundle && _vCancel && !_vCancel.hidden) {
//    CGFloat vCancelY = CGRectGetMidY(self.bounds) - 64.0f;
//    _vCancel.frame = CGRectMake(0, vCancelY, self.bounds.size.width, self.bounds.size.height - vCancelY);
//  }
//}

- (void)setManifest:(NSDictionary *)manifest
{
  [self _hidePlaceholder];
}

#pragma mark - internal

- (void)_setUpViews
{
  self.backgroundColor = [UIColor whiteColor];
  BOOL hasSplashScreen = NO;
//  if (_usesSplashFromNSBundle) {
//    // Display the launch screen behind the React view so that the React view appears to seamlessly load
//    NSArray *views;
//    @try {
//      NSString *launchScreen = (NSString *)[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UILaunchStoryboardName"] ?: @"LaunchScreen";
//      views = [[NSBundle mainBundle] loadNibNamed:launchScreen owner:self options:nil];
//    } @catch (NSException *_) {
//      DDLogWarn(@"Expo LaunchScreen.xib is missing. Unexpected loading behavior may occur.");
//    }
//    if (views) {
//      self.loadingView = views.firstObject;
//      self.loadingView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
//      [self addSubview:self.loadingView];
//
//      _loadingIndicatorFromNib = (UIActivityIndicatorView *)[self.loadingView viewWithTag:1];
//      _loadingIndicatorFromNib.hidesWhenStopped = YES;
//      [_loadingIndicatorFromNib startAnimating];
//      hasSplashScreen = YES;
//    }
//  }
  if (!hasSplashScreen) {
    self.loadingView = [[UIView alloc] init];
    [self addSubview:_loadingView];
    _loadingView.backgroundColor = [UIColor whiteColor];
//    if ([self _isCancelAvailable]) {
//      _vCancel = [[EXAppLoadingCancelView alloc] init];
//      _vCancel.delegate = self;
//      [self addSubview:_vCancel];
//    }
  }
  [self setNeedsLayout];
  [self setNeedsDisplay];
}

//+ (BOOL)_recordUsesSplashScreenFromNSBundle:(EXKernelAppRecord *)record
//{
//  if (record && record == [EXKernel sharedInstance].appRegistry.homeAppRecord) {
//    // home always uses splash
//    return YES;
//  } else {
//    // standalone apps use splash
//    return [EXEnvironment sharedEnvironment].isDetached;
//  }
//}

//- (BOOL)_isCancelAvailable
//{
//  return ([EXKernel sharedInstance].appRegistry.homeAppRecord != nil);
//}

- (void)_hidePlaceholder
{
  // if we used splash from NSBundle, we didn't use a placeholder in the first place
//  if ([self usesSplashFromNSBundle]) {
//    return;
//  }
//  dispatch_async(dispatch_get_main_queue(), ^{
//    if (self->_loadingIndicatorFromNib) {
//      [self->_loadingIndicatorFromNib stopAnimating];
//    }
//    if (self->_vCancel) {
//      self->_vCancel.hidden = YES;
//    }
//  });
}

//#pragma mark - delegate
//
//- (void)appLoadingCancelViewDidCancel:(EXAppLoadingCancelView *)view
//{
//  if ([EXKernel sharedInstance].browserController) {
//    [[EXKernel sharedInstance].browserController moveHomeToVisible];
//  }
//}

@end
