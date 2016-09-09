/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, ABI10_0_0RCTAnimationType) {
  ABI10_0_0RCTAnimationTypeSpring = 0,
  ABI10_0_0RCTAnimationTypeLinear,
  ABI10_0_0RCTAnimationTypeEaseIn,
  ABI10_0_0RCTAnimationTypeEaseOut,
  ABI10_0_0RCTAnimationTypeEaseInEaseOut,
  ABI10_0_0RCTAnimationTypeKeyboard,
};
