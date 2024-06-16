#import <UIKit/UIKit.h>
#import "EXHomeAppSplashScreenViewProvider.h"

@implementation EXHomeAppSplashScreenViewProvider

- (UIView *)createSplashScreenView
{
  UIView *splashScreenView = [super createSplashScreenView];
  
  UIActivityIndicatorView *activityIndicatorView = (UIActivityIndicatorView *)[splashScreenView viewWithTag:1];
  [activityIndicatorView startAnimating];
  
  return splashScreenView;
}

@end
