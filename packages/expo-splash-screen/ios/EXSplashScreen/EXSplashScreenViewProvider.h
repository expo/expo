// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import "EXSplashScreenController.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXSplashScreenViewProvider

- (UIView *)createSplashScreenView;
- (EXSplashScreenController *)createSplashScreenControllerWithView:(UIView *)rootView;

@end

NS_ASSUME_NONNULL_END
