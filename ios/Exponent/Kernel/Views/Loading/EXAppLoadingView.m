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

@interface RCTImageView (EXAppLoadingView)

@property (nonatomic, copy) RCTDirectEventBlock onLoadEnd;

@end

@interface EXAppLoadingView () <EXAppLoadingCancelViewDelegate>

@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicatorFromNib;
@property (nonatomic, strong) UIView *loadingView;
@property (nonatomic, assign) BOOL usesSplashFromNSBundle;
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

#pragma mark - internal

- (void)_setUpViews
{
  self.backgroundColor = [UIColor whiteColor];
  BOOL hasSplashScreen = NO;
  if (_usesSplashFromNSBundle) {
    // Display the launch screen behind the React view so that the React view appears to seamlessly load
    NSString *launchScreen = (NSString *)[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UILaunchStoryboardName"] ?: @"LaunchScreen";
    UIView *view;
    UIStoryboard *storyboard;
    @try {
      storyboard = [UIStoryboard storyboardWithName:launchScreen bundle:[NSBundle mainBundle]];
    } @catch (NSException *_) {
      UMLogWarn([NSString stringWithFormat:@"'%@.storyboard' file is missing. Fallbacking to '%@.xib' file.", launchScreen, launchScreen]);
    }
    if (storyboard) {
      @try {
        UIViewController *viewController = [storyboard instantiateInitialViewController];
        view = viewController.view;
      } @catch (NSException *_) {
        @throw [NSException exceptionWithName:@"ERR_INVALID_SPLASH_SCREEN"
                                       reason:[NSString stringWithFormat:@"'%@.storyboard' does not contain proper ViewController. Add correct ViewController to your '%@.storyboard' file.", launchScreen, launchScreen]
                                     userInfo:nil];
      }
    } else {
      NSArray *views;
      @try {
        views = [[NSBundle mainBundle] loadNibNamed:launchScreen owner:self options:nil];
      } @catch (NSException *_) {
        UMLogWarn([NSString stringWithFormat:@"Expo %@.xib is missing. Unexpected loading behavior may occur.", launchScreen]);
      }
      if (views) {
        view = views.firstObject;
        view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
      }
    }
    
    if (view) {
      self.loadingView = view;
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
    if ([UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad && splash[@"tabletImageUrl"]) {
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

#pragma mark - delegate

- (void)appLoadingCancelViewDidCancel:(EXAppLoadingCancelView *)view
{
  if ([EXKernel sharedInstance].browserController) {
    [[EXKernel sharedInstance].browserController moveHomeToVisible];
  }
}

@end
