/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTResizeMode.h"

@implementation ABI10_0_0RCTConvert(ABI10_0_0RCTResizeMode)

ABI10_0_0RCT_ENUM_CONVERTER(ABI10_0_0RCTResizeMode, (@{
  @"cover": @(ABI10_0_0RCTResizeModeCover),
  @"contain": @(ABI10_0_0RCTResizeModeContain),
  @"stretch": @(ABI10_0_0RCTResizeModeStretch),
  @"center": @(ABI10_0_0RCTResizeModeCenter),
  @"repeat": @(ABI10_0_0RCTResizeModeRepeat),
}), ABI10_0_0RCTResizeModeStretch, integerValue)

@end
