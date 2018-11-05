/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTResizeMode.h"

@implementation ABI28_0_0RCTConvert(ABI28_0_0RCTResizeMode)

ABI28_0_0RCT_ENUM_CONVERTER(ABI28_0_0RCTResizeMode, (@{
  @"cover": @(ABI28_0_0RCTResizeModeCover),
  @"contain": @(ABI28_0_0RCTResizeModeContain),
  @"stretch": @(ABI28_0_0RCTResizeModeStretch),
  @"center": @(ABI28_0_0RCTResizeModeCenter),
  @"repeat": @(ABI28_0_0RCTResizeModeRepeat),
}), ABI28_0_0RCTResizeModeStretch, integerValue)

@end
