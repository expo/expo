#import <UIKit/UIKit.h>
#import "EXHomeAppSplashScreenViewProvider.h"

@implementation EXHomeAppSplashScreenViewProvider

- (UIView *)createSplashScreenView
{
  UIView *splashScreenView = [super createSplashScreenView];
  
  UIActivityIndicatorView *activityIdicatorView = (UIActivityIndicatorView *)[splashScreenView viewWithTag:1];
  activityIdicatorView.hidesWhenStopped = YES;
  [activityIdicatorView startAnimating];
  
  return splashScreenView;
}

@end
