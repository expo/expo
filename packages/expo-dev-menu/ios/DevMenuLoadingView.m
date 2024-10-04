// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevMenu/DevMenuLoadingView.h>

#if __has_include(<React/RCTDevLoadingViewProtocol.h>)

@implementation DevMenuLoadingView

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
