/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTResizeMode.h"

@implementation ABI32_0_0RCTConvert(ABI32_0_0RCTResizeMode)

ABI32_0_0RCT_ENUM_CONVERTER(ABI32_0_0RCTResizeMode, (@{
  @"cover": @(ABI32_0_0RCTResizeModeCover),
  @"contain": @(ABI32_0_0RCTResizeModeContain),
  @"stretch": @(ABI32_0_0RCTResizeModeStretch),
  @"center": @(ABI32_0_0RCTResizeModeCenter),
  @"repeat": @(ABI32_0_0RCTResizeModeRepeat),
}), ABI32_0_0RCTResizeModeStretch, integerValue)

@end
