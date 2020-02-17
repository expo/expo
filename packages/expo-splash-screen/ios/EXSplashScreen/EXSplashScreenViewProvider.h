// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXSplashScreenImageResizeMode) {
  EXSplashScreenImageResizeMode_CONTAIN = 0,
  EXSplashScreenImageResizeMode_COVER = 1
};

@protocol EXSplashScreenViewProvider

- (UIView *)createSplashScreenView:(EXSplashScreenImageResizeMode)resizeMode;

@end

NS_ASSUME_NONNULL_END
