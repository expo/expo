// Copyright © 2018 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenViewController.h>
#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXUtilities.h>

static NSString * const InfoPlistFadeTimeKey = @"EXSplashScreenFadeTime";

static NSTimeInterval const FadeTimeMinAllowedValue = 0.0;
static NSTimeInterval const FadeTimeMaxAllowedValue = 5.0;

@interface EXSplashScreenViewController ()

@property (nonatomic, weak) UIView *rootView;

@property (nonatomic, assign) BOOL autoHideEnabled;
@property (nonatomic, assign) BOOL splashScreenShown;
@property (nonatomic, assign) BOOL appContentAppeared;
@property (nonatomic, assign) NSTimeInterval fadeTime;

@end

@implementation EXSplashScreenViewController

- (instancetype)initWithRootView:(UIView *)rootView splashScreenView:(nonnull UIView *)splashScreenView
{
  if (self = [super init]) {
    _rootView = rootView;
    _autoHideEnabled = YES;
    _splashScreenShown = NO;
    _appContentAppeared = NO;
    _splashScreenView = splashScreenView;
    NSTimeInterval fadeTimeValue = [[[NSBundle mainBundle] objectForInfoDictionaryKey:InfoPlistFadeTimeKey] doubleValue] / 1000.0;
    if (fadeTimeValue >= FadeTimeMinAllowedValue &&
        fadeTimeValue <= FadeTimeMaxAllowedValue) {
      _fadeTime = fadeTimeValue;
    } else {
      _fadeTime = 0.0;
    }
  }
  return self;
}

# pragma mark public methods

- (void)showWithCallback:(void (^)(void))successCallback failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  [self showWithCallback:successCallback];
}

- (void)showWithCallback:(nullable void(^)(void))successCallback
{
  [EXUtilities performSynchronouslyOnMainThread:^{
    UIView *rootView = self.rootView;
    self.splashScreenView.frame = rootView.bounds;
    [rootView addSubview:self.splashScreenView];
    self.splashScreenShown = YES;
    if (successCallback) {
      successCallback();
    }
  }];
}

- (void)preventAutoHideWithCallback:(void (^)(BOOL))successCallback failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if (!_autoHideEnabled) {
    return successCallback(NO);
  }

  _autoHideEnabled = NO;
  successCallback(YES);
}

- (void)hideWithCallback:(void (^)(BOOL))successCallback failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if (!_splashScreenShown) {
    return successCallback(NO);
  }
  
  [self hideWithCallback:successCallback];
}

- (void)hideWithCallback:(nullable void(^)(BOOL))successCallback
{
  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    if (self->_fadeTime > 0.0) {
      [UIView animateWithDuration:1.0
           animations:^{self.splashScreenView.alpha = 0.0;}
           completion:^(BOOL finished){
        [self.splashScreenView removeFromSuperview];
        self.splashScreenShown = NO;
        self.autoHideEnabled = YES;
        if (successCallback) {
          successCallback(YES);
        }
      }];
    } else {
      [self.splashScreenView removeFromSuperview];
      self.splashScreenShown = NO;
      self.autoHideEnabled = YES;
      if (successCallback) {
        successCallback(YES);
      }
    }
  });
}

- (BOOL)needsHideOnAppContentDidAppear
{
  if (!_appContentAppeared && _autoHideEnabled) {
    _appContentAppeared = YES;
    return YES;
  }
  return NO;
}

- (BOOL)needsShowOnAppContentWillReload
{
  if (!_appContentAppeared) {
    _autoHideEnabled = YES;
    _appContentAppeared = NO;
    return YES;
  }
  return NO;
}

@end
