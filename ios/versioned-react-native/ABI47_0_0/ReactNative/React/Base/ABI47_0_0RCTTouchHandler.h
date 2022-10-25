/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTFrameUpdate.h>

@class ABI47_0_0RCTBridge;

@interface ABI47_0_0RCTTouchHandler : UIGestureRecognizer

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)attachToView:(UIView *)view;
- (void)detachFromView:(UIView *)view;

- (void)cancel;

@end
