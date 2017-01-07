/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTResizeMode.h"

@implementation ABI13_0_0RCTConvert(ABI13_0_0RCTResizeMode)

ABI13_0_0RCT_ENUM_CONVERTER(ABI13_0_0RCTResizeMode, (@{
  @"cover": @(ABI13_0_0RCTResizeModeCover),
  @"contain": @(ABI13_0_0RCTResizeModeContain),
  @"stretch": @(ABI13_0_0RCTResizeModeStretch),
  @"center": @(ABI13_0_0RCTResizeModeCenter),
  @"repeat": @(ABI13_0_0RCTResizeModeRepeat),
}), ABI13_0_0RCTResizeModeStretch, integerValue)

@end
