// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI42_0_0EXSplashScreen/ABI42_0_0EXSplashScreenController.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMDefines.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>

@interface ABI42_0_0EXSplashScreenController ()

@property (nonatomic, weak) UIViewController *viewController;
@property (nonatomic, strong) UIView *splashScreenView;

@property (nonatomic, assign) BOOL autoHideEnabled;
@property (nonatomic, assign) BOOL splashScreenShown;
@property (nonatomic, assign) BOOL appContentAppeared;

@end

@implementation ABI42_0_0EXSplashScreenController

- (instancetype)initWithViewController:(UIViewController *)viewController
              splashScreenViewProvider:(id<ABI42_0_0EXSplashScreenViewProvider>)splashScreenViewProvider
{
  if (self = [super init]) {
    _viewController = viewController;
    _autoHideEnabled = YES;
    _splashScreenShown = NO;
    _appContentAppeared = NO;
    _splashScreenView = [splashScreenViewProvider createSplashScreenView];
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
  [ABI42_0_0UMUtilities performSynchronouslyOnMainThread:^{
    UIView *rootView = self.viewController.view;
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
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    [self.splashScreenView removeFromSuperview];
    self.splashScreenShown = NO;
    self.autoHideEnabled = YES;
    if (successCallback) {
      successCallback(YES);
    }
  });
}

- (void)onAppContentDidAppear
{
  if (!_appContentAppeared && _autoHideEnabled) {
    _appContentAppeared = YES;
    [self hideWithCallback:nil];
  }
}

- (void)onAppContentWillReload
{
  if (!_appContentAppeared) {
    _autoHideEnabled = YES;
    _appContentAppeared = NO;
    [self showWithCallback:nil];
  }
}

@end
