/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class ABI44_0_0RCTLoadingProgress;

@protocol ABI44_0_0RCTDevLoadingViewProtocol <NSObject>
+ (void)setEnabled:(BOOL)enabled;
- (void)showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor;
- (void)showWithURL:(NSURL *)URL;
- (void)updateProgress:(ABI44_0_0RCTLoadingProgress *)progress;
- (void)hide;
@end
