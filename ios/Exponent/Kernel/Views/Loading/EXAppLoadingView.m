#import "EXAppLoadingView.h"
#import "EXAppLoadingCancelView.h"
#import "EXAppLoadingProgressView.h"
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

@interface RCTImageView (EXAppLoadingView)

@property (nonatomic, copy) RCTDirectEventBlock onLoadEnd;

@end

@interface EXAppLoadingView () <EXAppLoadingCancelViewDelegate>

@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicatorFromNib;
@property (nonatomic, strong) UIView *loadingView;
@property (nonatomic, assign) BOOL usesSplashFromNSBundle;
@property (nonatomic, strong) EXAppLoadingProgressView *vProgress;
@property (nonatomic, strong) RCTImageView *vBackgroundImage;
@property (nonatomic, strong) EXAppLoadingCancelView *vCancel;

@end

@implementation EXAppLoadingView

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record
{
  if (self = [super init]) {
    _usesSplashFromNSBundle = [[self class] _recordUsesSplashScreenFromNSBundle:record];
    [self _setUpViews];
  }
  return self;
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
  _loadingView.frame = self.bounds;
  _vBackgroundImage.frame = self.bounds;
  
  CGFloat progressHeight = ([self _isIPhoneX]) ? 48.0f : 36.0f;
  _vProgress.frame = CGRectMake(0, self.bounds.size.height - progressHeight, self.bounds.size.width, progressHeight);
  if (!_usesSplashFromNSBundle && !_manifest && _vCancel) {
    CGFloat vCancelY = CGRectGetMidY(self.bounds) - 64.0f;
    _vCancel.frame = CGRectMake(0, vCancelY, self.bounds.size.width, self.bounds.size.height - vCancelY);
  }
}

- (void)setManifest:(NSDictionary *)manifest
{
  _manifest = manifest;
  [self _updateViewsWithManifest];
}

- (void)updateStatusWithProgress:(EXLoadingProgress *)progress
{
  [_vProgress updateStatusWithProgress:progress];
  _vProgress.hidden = !(progress.total.floatValue > 0.0f);
}

#pragma mark - internal

- (void)_setUpViews
{
  self.backgroundColor = [UIColor whiteColor];
  BOOL hasSplashScreen = NO;
  if (_usesSplashFromNSBundle) {
    // Display the launch screen behind the React view so that the React view appears to seamlessly load
    NSArray *views;
    @try {
      views = [[NSBundle mainBundle] loadNibNamed:@"LaunchScreen" owner:self options:nil];
    } @catch (NSException *_) {
      DDLogWarn(@"Expo LaunchScreen.xib is missing. Unexpected loading behavior may occur.");
    }
    if (views) {
      self.loadingView = views.firstObject;
      self.loadingView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
      [self addSubview:self.loadingView];
      
      _loadingIndicatorFromNib = (UIActivityIndicatorView *)[self.loadingView viewWithTag:1];
      _loadingIndicatorFromNib.hidesWhenStopped = YES;
      [_loadingIndicatorFromNib startAnimating];
      hasSplashScreen = YES;
    }
  }
  if (!hasSplashScreen) {
    self.loadingView = [[UIView alloc] init];
    [self addSubview:_loadingView];
    _loadingView.backgroundColor = [UIColor whiteColor];
    if ([self _isCancelAvailable]) {
      _vCancel = [[EXAppLoadingCancelView alloc] init];
      _vCancel.delegate = self;
      [self addSubview:_vCancel];
    }
  }
  _vProgress = [[EXAppLoadingProgressView alloc] init];
  _vProgress.hidden = YES;
  [self addSubview:_vProgress];
  [self setNeedsLayout];
  [self setNeedsDisplay];
}

+ (BOOL)_recordUsesSplashScreenFromNSBundle:(EXKernelAppRecord *)record
{
  if (record && record == [EXKernel sharedInstance].appRegistry.homeAppRecord) {
    // home always uses splash
    return YES;
  } else {
    // standalone apps use splash
    return [EXEnvironment sharedEnvironment].isDetached;
  }
}

- (void)_updateViewsWithManifest
{
  if (!_manifest) {
    return;
  }
  UIColor *backgroundColor = [UIColor whiteColor];
  RCTResizeMode backgroundImageResizeMode = RCTResizeModeContain;
  if (_vBackgroundImage) {
    [_vBackgroundImage removeFromSuperview];
    _vBackgroundImage = nil;
  }

  RCTImageSource *imageSource;
  NSDictionary *splash;
  
  @try {
    if (_manifest[@"ios"] && _manifest[@"ios"][@"splash"]) {
      splash = _manifest[@"ios"][@"splash"];
    } else if (_manifest[@"splash"]) {
      splash = _manifest[@"splash"];
    }

    UIColor *maybeColor = [EXUtil colorWithHexString:splash[@"backgroundColor"]];
    if (maybeColor) {
      backgroundColor = maybeColor;
    }
    backgroundImageResizeMode = ([splash[@"resizeMode"] isEqualToString:@"cover"]) ? RCTResizeModeCover : RCTResizeModeContain;
    
    NSString *imageUrl;
    if (splash[@"tabletImageUrl"]) {
      imageUrl = splash[@"tabletImageUrl"];
    } else if (splash[@"imageUrl"]) {
      imageUrl = splash[@"imageUrl"];
    }
    if (imageUrl) {
      imageSource = [RCTConvert RCTImageSource:@{ @"uri":imageUrl }];
    }
  } @catch (NSException *e) {}
  
  EXKernelAppRecord *homeAppRecord = [EXKernel sharedInstance].appRegistry.homeAppRecord;
  if (imageSource && homeAppRecord.appManager.reactBridge) {
    // hey, it's better than pulling in SDWebImage, right?
    _vBackgroundImage = [[RCTImageView alloc] initWithBridge:homeAppRecord.appManager.reactBridge];
    _vBackgroundImage.frame = self.bounds;
    _vBackgroundImage.imageSources = @[ imageSource ];
    _vBackgroundImage.resizeMode = backgroundImageResizeMode;
    __weak typeof(self) weakSelf = self;
    [_vBackgroundImage setOnLoadEnd:^(NSDictionary *dict) {
      [weakSelf _hidePlaceholder];
    }];
    [self addSubview:_vBackgroundImage];
  } else {
    [self _hidePlaceholder];
  }
  
  _loadingView.backgroundColor = backgroundColor;
  [self bringSubviewToFront:_vProgress];
}

- (BOOL)_isCancelAvailable
{
  return ([EXKernel sharedInstance].appRegistry.homeAppRecord != nil);
}

- (void)_hidePlaceholder
{
  // if we used splash from NSBundle, we didn't use a placeholder in the first place
  if ([self usesSplashFromNSBundle]) {
    return;
  }
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_loadingIndicatorFromNib) {
      [self->_loadingIndicatorFromNib stopAnimating];
    }
    if (self->_vCancel) {
      self->_vCancel.hidden = YES;
    }
  });
}

- (BOOL)_isIPhoneX
{
  return (
    [[EXConstantsService deviceModel] isEqualToString:@"iPhone X"] // doesn't work on sim
    || [UIScreen mainScreen].nativeBounds.size.height == 2436.0f
  );
}

#pragma mark - delegate

- (void)appLoadingCancelViewDidCancel:(EXAppLoadingCancelView *)view
{
  if ([EXKernel sharedInstance].browserController) {
    [[EXKernel sharedInstance].browserController moveHomeToVisible];
  }
}

@end
