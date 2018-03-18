#import "EXAppLoadingView.h"
#import "EXAppLoadingCancelView.h"
#import "EXAppLoadingProgressView.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXShellManager.h"
#import "EXReactAppManager.h"
#import "EXResourceLoader.h"
#import "EXUtil.h"

#import <React/RCTComponent.h>
#import <React/RCTImageSource.h>
#import <React/RCTImageView.h>

@interface RCTImageView (EXAppLoadingView)

@property (nonatomic, copy) RCTDirectEventBlock onLoadEnd;

@end

@interface EXAppLoadingView () <EXAppLoadingCancelViewDelegate>

@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicator;
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
  _vProgress.frame = CGRectMake(0, self.bounds.size.height - 36.0f, self.bounds.size.width, 36.0f);
  if (!_usesSplashFromNSBundle && !_manifest) {
    // show placeholder loading indicator if we have nothing else
    _loadingIndicator.center = CGPointMake(CGRectGetMidX(self.bounds), CGRectGetMidY(self.bounds));
    if (_vCancel) {
      _loadingIndicator.center = CGPointMake(_loadingIndicator.center.x, _loadingIndicator.center.y - 64.0f);
      CGFloat vCancelY = CGRectGetMaxY(_loadingIndicator.frame) + 8.0f;
      _vCancel.frame = CGRectMake(0, vCancelY, self.bounds.size.width, self.bounds.size.height - vCancelY);
    }
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
      self.loadingView.layer.zPosition = 1000;
      self.loadingView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
      [self addSubview:self.loadingView];
      
      _loadingIndicator = (UIActivityIndicatorView *)[self.loadingView viewWithTag:1];
      hasSplashScreen = YES;
    }
  }
  if (!hasSplashScreen) {
    self.loadingView = [[UIView alloc] init];
    [self addSubview:_loadingView];
    _loadingView.backgroundColor = [UIColor whiteColor];
    _loadingIndicator = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
    [_loadingIndicator setColor:[UIColor blackColor]];
    [self addSubview:_loadingIndicator];
    if ([self _isCancelAvailable]) {
      _vCancel = [[EXAppLoadingCancelView alloc] init];
      _vCancel.delegate = self;
      [self addSubview:_vCancel];
    }
  }
  _loadingIndicator.hidesWhenStopped = YES;
  [_loadingIndicator startAnimating];
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
    // most shell apps use splash unless overridden
    // TODO: disable if this is a different appManager but still run in a shell context.
    return [EXShellManager sharedInstance].isShell && !([EXShellManager sharedInstance].isSplashScreenDisabled);
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
    [_loadingIndicator stopAnimating];
    if (_vCancel) {
      _vCancel.hidden = YES;
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
