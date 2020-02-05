// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenModule.h>
#import <UMCore/UMUtilities.h>
#import <React/RCTBridge.h>

@interface EXSplashScreenModule ()

@property (nonatomic, assign) UIView *splashScreenView;
@property (nonatomic, strong) UIViewController *splashScreenViewController;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (assign) BOOL preventAutoHide;

@end

@implementation EXSplashScreenModule

UM_EXPORT_MODULE(ExpoSplashScreen);

- (instancetype)init
{
  if (self = [super init]) {
    _preventAutoHide = NO;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleDidFinishLaunchingNotification:)
                                                 name:UIApplicationDidFinishLaunchingNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleRCTJavaScriptDidLoadNotification:)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleRCTJavaScriptDidFailToLoadNotification:)
                                                 name:RCTJavaScriptDidFailToLoadNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleRCTBridgeWillReloadNotification:)
                                                 name:RCTBridgeWillReloadNotification
                                               object:nil];
  }
  return self;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

# pragma mark handling RCTBridgeWillReloadNotification

- (void)handleRCTBridgeWillReloadNotification:(NSNotification *)notification
{
  [self showSplashScreenView];
}

# pragma mark handling RCTJavaScriptDidFailToLoadNotification

- (void)handleRCTJavaScriptDidFailToLoadNotification:(NSNotification *)notification
{
  [self hideSplashScreenView];
}

# pragma mark handling handleRCTJavaScriptDidLoadNotification

- (void)handleRCTJavaScriptDidLoadNotification:(NSNotification *)notification
{
  UM_WEAKIFY(self);
  dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC * 0.2);
  dispatch_after(delay, self.methodQueue, ^{
    UM_ENSURE_STRONGIFY(self);
    if (!self->_preventAutoHide) {
      [self hideSplashScreenView];
    }
  });
}

# pragma mark handling UIApplicationDidFinishLaunchingNotification

- (void)handleDidFinishLaunchingNotification:(NSNotification *)notification
{
  [self showSplashScreenView];
}

# pragma mark unimodule methods

UM_EXPORT_METHOD_AS(hideAsync,
                    hideWithResolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  _preventAutoHide = NO;
  [self hideSplashScreenView];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(preventAutoHideAsync,
                    preventAutoHideWithResolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  _preventAutoHide = YES;
  resolve(nil);
}

# pragma mark private methods

- (void)hideSplashScreenView
{
  UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    UM_STRONGIFY(self);
    [self->_splashScreenView removeFromSuperview];
    self->_splashScreenView = nil;
  });
}

- (void)showSplashScreenView
{
  if (_splashScreenView) {
    return;
  }
  UIViewController *splashScreenViewController = [UIViewController new];
  _splashScreenViewController = splashScreenViewController;
  _splashScreenView = [[[NSBundle mainBundle] loadNibNamed:@"LaunchScreen" owner:self options:nil] objectAtIndex:0];
  
  CGRect frame = [UIApplication sharedApplication].keyWindow.rootViewController.view.frame;
  frame.origin = CGPointMake(0, 0);
  _splashScreenView.frame = frame;
  _splashScreenViewController.view = _splashScreenView;
                  ;
  UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    UM_STRONGIFY(self);
    [[UIApplication sharedApplication].keyWindow addSubview:self->_splashScreenView];
  });
}

@end
