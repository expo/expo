// Copyright © 2018 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenViewNativeProvider.h>
#import <ExpoModulesCore/EXLogManager.h>

@implementation EXSplashScreenViewNativeProvider

- (nonnull UIView *)createSplashScreenView
{
  NSString *splashScreenFilename = (NSString *)[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UILaunchStoryboardName"] ?: @"SplashScreen";
  UIStoryboard *storyboard;
  @try {
    storyboard = [UIStoryboard storyboardWithName:splashScreenFilename bundle:[NSBundle mainBundle]];
  } @catch (NSException *_) {
    EXLogWarn([NSString stringWithFormat:@"'%@.storyboard' file is missing. Fallbacking to '%@.xib' file.", splashScreenFilename, splashScreenFilename]);
  }
  if (storyboard) {
    @try {
      UIViewController *splashScreenViewController = [storyboard instantiateInitialViewController];
      UIView *splashScreenView = splashScreenViewController.view;
      return splashScreenView;
    } @catch (NSException *_) {
      @throw [NSException exceptionWithName:@"ERR_INVALID_SPLASH_SCREEN"
                                     reason:[NSString stringWithFormat:@"'%@.storyboard'does not contain proper ViewController. Add correct ViewController to your '%@.storyboard' file (https://github.com/expo/expo/tree/main/packages/expo-splash-screen#-configure-ios).", splashScreenFilename, splashScreenFilename]
                                   userInfo:nil];
    }
  }
  
  NSArray *views;
  @try {
    views = [[NSBundle mainBundle] loadNibNamed:splashScreenFilename owner:self options:nil];
  } @catch (NSException *_) {
    EXLogWarn([NSString stringWithFormat:@"'%@.xib' file is missing - 'expo-splash-screen' will not work as expected.", splashScreenFilename]);
  }
  if (views) {
    if (!views.firstObject) {
      @throw [NSException exceptionWithName:@"ERR_INVALID_SPLASH_SCREEN"
                                     reason:[NSString stringWithFormat:@"'%@.xib' does not contain any views. Add a view to the '%@.xib' or create '%@.storyboard' (https://github.com/expo/expo/tree/main/packages/expo-splash-screen#-configure-ios).", splashScreenFilename, splashScreenFilename, splashScreenFilename]
                                   userInfo:nil];
    }
    UIView *view = views.firstObject;
    view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    return view;
  }
  
  @throw [NSException exceptionWithName:@"ERR_NO_SPLASH_SCREEN"
                                 reason:[NSString stringWithFormat:@"Couln't locate neither '%@.storyboard' file nor '%@.xib' file. Create one of these in the project to make 'expo-splash-screen' work (https://github.com/expo/expo/tree/main/packages/expo-splash-screen#-configure-ios).", splashScreenFilename, splashScreenFilename]
                               userInfo:nil];
}

@end
