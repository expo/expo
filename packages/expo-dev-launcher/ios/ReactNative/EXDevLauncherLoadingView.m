// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncherLoadingView.h>

#if __has_include(<React/RCTDevLoadingViewProtocol.h>)

#import <UIKit/UIKit.h>

@implementation EXDevLauncherLoadingView

+ (NSString *)moduleName
{
  return @"DevLoadingView";
}

+ (void)setEnabled:(BOOL)enabled {}
- (void)showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor {}
- (void)showWithURL:(NSURL *)URL {}
- (void)updateProgress:(RCTLoadingProgress *)progress {}
- (void)hide {}

@end

#endif
