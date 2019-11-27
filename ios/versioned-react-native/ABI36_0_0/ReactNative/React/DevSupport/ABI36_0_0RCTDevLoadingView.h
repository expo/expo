/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>

@class ABI36_0_0RCTLoadingProgress;

@interface ABI36_0_0RCTDevLoadingView : NSObject <ABI36_0_0RCTBridgeModule>

+ (void)setEnabled:(BOOL)enabled;
- (void)showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor;
- (void)showWithURL:(NSURL *)URL;
- (void)updateProgress:(ABI36_0_0RCTLoadingProgress *)progress;
- (void)hide;

@end
