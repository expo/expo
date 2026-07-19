#import "EXProgressHUD.h"
#import "Expo_Go-Swift.h"

@interface EXProgressHUD()

@property (nonatomic, weak) MBProgressHUD *warningHud;

@end

@implementation EXProgressHUD

- (void)showWarning:(UIView *)view
{
  _warningHud =  [MBProgressHUD showHUDAddedTo: view animated:YES];
  _warningHud.mode = MBProgressHUDModeCustomView;
  
  EXSplashScreenHUDButton *button = [EXSplashScreenHUDButton buttonWithType: UIButtonTypeSystem];
  [button addTarget:self action:@selector(navigateToFYI) forControlEvents:UIControlEventTouchUpInside];
  
  _warningHud.customView = button;
  _warningHud.offset = CGPointMake(0.f, MBProgressMaxOffset);
  
  [_warningHud hideAnimated:YES afterDelay:8.f];
}

- (void)navigateToFYI
{
  NSURL *fyiURL = [[NSURL alloc] initWithString:@"https://expo.fyi/splash-screen-hanging"];
  [[UIApplication sharedApplication] openURL:fyiURL options:@{} completionHandler:nil];
  [_warningHud hideAnimated: YES];
}

@end

