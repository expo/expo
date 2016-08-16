/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI6_0_0RCTFrameUpdate.h"

@class ABI6_0_0RCTBridge;

@interface ABI6_0_0RCTTouchHandler : UIGestureRecognizer

- (instancetype)initWithBridge:(ABI6_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;
- (void)cancel;

@end
