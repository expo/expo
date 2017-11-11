/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI23_0_0/ABI23_0_0RCTFrameUpdate.h>

@class ABI23_0_0RCTBridge;

@interface ABI23_0_0RCTTouchHandler : UIGestureRecognizer

- (instancetype)initWithBridge:(ABI23_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)attachToView:(UIView *)view;
- (void)detachFromView:(UIView *)view;

- (void)cancel;

@end
