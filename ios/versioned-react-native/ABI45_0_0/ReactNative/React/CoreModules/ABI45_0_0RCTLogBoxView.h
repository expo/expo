/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0RCTSurfaceView.h>
#import <UIKit/UIKit.h>

@interface ABI45_0_0RCTLogBoxView : UIWindow

- (instancetype)initWithFrame:(CGRect)frame;

- (void)createRootViewController:(UIView *)view;

- (instancetype)initWithFrame:(CGRect)frame bridge:(ABI45_0_0RCTBridge *)bridge;

- (void)show;

@end
