/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI21_0_0RCTResizeMode.h"

@implementation ABI21_0_0RCTConvert(ABI21_0_0RCTResizeMode)

ABI21_0_0RCT_ENUM_CONVERTER(ABI21_0_0RCTResizeMode, (@{
  @"cover": @(ABI21_0_0RCTResizeModeCover),
  @"contain": @(ABI21_0_0RCTResizeModeContain),
  @"stretch": @(ABI21_0_0RCTResizeModeStretch),
  @"center": @(ABI21_0_0RCTResizeModeCenter),
  @"repeat": @(ABI21_0_0RCTResizeModeRepeat),
}), ABI21_0_0RCTResizeModeStretch, integerValue)

@end
