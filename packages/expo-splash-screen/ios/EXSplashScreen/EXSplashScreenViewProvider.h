// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Provides a view for SplashScreen that is shown once native LaunchScreen hides.
 */
@protocol EXSplashScreenViewProvider

- (UIView *)createSplashScreenView;

@end

NS_ASSUME_NONNULL_END
