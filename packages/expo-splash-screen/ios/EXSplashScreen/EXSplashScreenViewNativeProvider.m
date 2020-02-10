// Copyright © 2018 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenViewNativeProvider.h>
#import <UMCore/UMLogManager.h>

@implementation EXSplashScreenViewNativeProvider

- (nonnull UIView *)createSplashScreenView:(EXSplashScreenImageResizeMode)resizeMode {
  @try {
    UIStoryboard *storyboard = [UIStoryboard storyboardWithName:@"SplashScreen" bundle:[NSBundle mainBundle]];
    UIViewController *splashScreenViewController = [storyboard instantiateViewControllerWithIdentifier:@"SplashScreenViewController"];
    UIView *splashScreenView = splashScreenViewController.view;
    return splashScreenView;
  } @catch (NSException *_) {
    UMLogInfo(@"Expo SplashScreen.storyboard is missing.");
  }
  
  @try {
    NSArray *views = [[NSBundle mainBundle] loadNibNamed:@"SplashScreen" owner:self options:nil];
    UIView *splashScreenView = views.firstObject;
//    splashScreenView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    return splashScreenView;
  } @catch (NSException *_) {
    UMLogInfo(@"Expo SplashScreen.xib is missing.");
  }
  
  @throw [NSException exceptionWithName:@"ERR_NO_SPLASH_SCREEN" reason:@"No SplashScreen.xib or SplashScreen.storyboard is available" userInfo:nil];
}

@end
