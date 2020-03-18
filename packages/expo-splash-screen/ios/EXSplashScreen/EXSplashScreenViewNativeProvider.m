// Copyright © 2018 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenViewNativeProvider.h>
#import <UMCore/UMLogManager.h>

@implementation EXSplashScreenViewNativeProvider

- (nonnull UIView *)createSplashScreenView
{
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
    return splashScreenView;
  } @catch (NSException *_) {
    UMLogInfo(@"Expo SplashScreen.xib is missing.");
  }
  
  @throw [NSException exceptionWithName:@"ERR_NO_SPLASH_SCREEN" reason:@"Couln't locate neither 'SplashScreen.storyboard' file nor 'SplashScreen.xib' file. Create one of these in the project to make 'expo-splash-screen' work." userInfo:nil];
}

@end
