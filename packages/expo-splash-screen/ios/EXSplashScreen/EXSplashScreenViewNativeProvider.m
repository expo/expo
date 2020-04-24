// Copyright © 2018 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenViewNativeProvider.h>
#import <UMCore/UMLogManager.h>

@implementation EXSplashScreenViewNativeProvider

- (nonnull UIView *)createSplashScreenView
{
  UIStoryboard *storyboard;
  @try {
    storyboard = [UIStoryboard storyboardWithName:@"SplashScreen" bundle:[NSBundle mainBundle]];
  } @catch (NSException *_) {
    UMLogInfo(@"'SplashScreen.storyboard' file is missing. Fallbacking to 'SplashScreen.xib' file.");
  }
  if (storyboard) {
    @try {
      UIViewController *splashScreenViewController = [storyboard instantiateViewControllerWithIdentifier:@"SplashScreenViewController"];
      UIView *splashScreenView = splashScreenViewController.view;
      return splashScreenView;
    } @catch (NSException *_) {
      @throw [NSException exceptionWithName:@"ERR_INVALID_SPLASH_SCREEN" reason:@"'SplashScreen.storyboard' does not contain ViewController named 'SplashScreenViewController'. Add correctly named ViewController to 'SplashScreen.storyboard' (https://github.com/expo/expo/tree/master/packages/expo-splash-screen#-configure-ios)." userInfo:nil];
    }
  }
  
  NSArray *views;
  @try {
    views = [[NSBundle mainBundle] loadNibNamed:@"SplashScreen" owner:self options:nil];
  } @catch (NSException *_) {
    UMLogInfo(@"'SplashScreen.xib' file is missing - 'expo-splash-screen' would not work as expected.");
  }
  if (views) {
    if (!views.firstObject) {
      @throw [NSException exceptionWithName:@"ERR_INVALID_SPLASH_SCREEN" reason:@"'SplashScreen.xib' does not contain any views. Add a view to the 'SplashScreen.xib' or create 'SplashScreen.storyboard' (https://github.com/expo/expo/tree/master/packages/expo-splash-screen#-configure-ios)." userInfo:nil];
    }
    return views.firstObject;
  }

  // TODO (@bbarthec): handle fallbacking to default RN Launch Screen view better
  // @throw [NSException exceptionWithName:@"ERR_NO_SPLASH_SCREEN" reason:@"Couln't locate neither 'SplashScreen.storyboard' file nor 'SplashScreen.xib' file. Create one of these in the project to make 'expo-splash-screen' work (https://github.com/expo/expo/tree/master/packages/expo-splash-screen#-configure-ios)." userInfo:nil];

  return [self createSplashScreenViewFallback];
}

- (nonnull UIView *)createSplashScreenViewFallback
{
  UIView *view;
  NSArray *views;
  @try {
    NSString *launchScreen = (NSString *)[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UILaunchStoryboardName"] ?: @"LaunchScreen";
    views = [[NSBundle mainBundle] loadNibNamed:launchScreen owner:self options:nil];
  } @catch (NSException *_) {
    NSLog(@"LaunchScreen.xib is missing. Unexpected loading behavior may occur.");
  }
  if (views) {
    view = views.firstObject;
    view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  } else {
    view = [UIView new];
    view.backgroundColor = [UIColor whiteColor];
  }

  return view;
}

@end
