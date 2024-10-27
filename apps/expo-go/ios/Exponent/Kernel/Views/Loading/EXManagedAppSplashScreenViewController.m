#import <MBProgressHUD/MBProgressHUD.h>

#import "EXManagedAppSplashScreenViewController.h"
#import "EXSplashScreenHUDButton.h"

@interface EXManagedAppSplashScreenViewController()

@property (nonatomic, weak) NSTimer *warningTimer;
@property (nonatomic, weak) MBProgressHUD *warningHud;

@end

@implementation EXManagedAppSplashScreenViewController

- (instancetype)initWithRootView:(UIView *)rootView splashScreenView:(UIView *)splashScreenView
{
  if (self = [super initWithRootView:rootView splashScreenView:splashScreenView]) {
    self.splashScreenView.userInteractionEnabled = YES;
  }
  
  return self;
}

- (void)showWithCallback:(void (^)(void))successCallback failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  [super showWithCallback:^{
    if (successCallback) {
      successCallback();
    }
  } failureCallback:failureCallback];
}

- (void)hideWithCallback:(void (^)(BOOL))successCallback failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  [super hideWithCallback:^(BOOL isSuccess){
    if (self.warningTimer) {
      [self.warningTimer invalidate];
    }
    
    if (successCallback) {
      successCallback(YES);
    }
  } failureCallback:failureCallback];
}


-(void)startSplashScreenVisibleTimer
{
  self.warningTimer = [NSTimer scheduledTimerWithTimeInterval:20.0
                                                       target:self
                                                     selector:@selector(showSplashScreenVisibleWarning)
                                                     userInfo:nil
                                                      repeats:NO];
}

- (void)showSplashScreenVisibleWarning
{
#if DEBUG
  _warningHud = [MBProgressHUD showHUDAddedTo: self.splashScreenView animated:YES];
  _warningHud.mode = MBProgressHUDModeCustomView;
  
  EXSplashScreenHUDButton *button = [EXSplashScreenHUDButton buttonWithType: UIButtonTypeSystem];
  [button addTarget:self action:@selector(navigateToFYI) forControlEvents:UIControlEventTouchUpInside];

  _warningHud.customView = button;
  _warningHud.offset = CGPointMake(0.f, MBProgressMaxOffset);
  
  [_warningHud hideAnimated:YES afterDelay:8.f];
#endif
}

- (void)navigateToFYI
{
  NSURL *fyiURL = [[NSURL alloc] initWithString:@"https://expo.fyi/splash-screen-hanging"];
  [[UIApplication sharedApplication] openURL:fyiURL options:@{} completionHandler:nil];
  [_warningHud hideAnimated: YES];
}

@end
