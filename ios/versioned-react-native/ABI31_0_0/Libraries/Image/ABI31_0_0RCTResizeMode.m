/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTResizeMode.h"

@implementation ABI31_0_0RCTConvert(ABI31_0_0RCTResizeMode)

ABI31_0_0RCT_ENUM_CONVERTER(ABI31_0_0RCTResizeMode, (@{
  @"cover": @(ABI31_0_0RCTResizeModeCover),
  @"contain": @(ABI31_0_0RCTResizeModeContain),
  @"stretch": @(ABI31_0_0RCTResizeModeStretch),
  @"center": @(ABI31_0_0RCTResizeModeCenter),
  @"repeat": @(ABI31_0_0RCTResizeModeRepeat),
}), ABI31_0_0RCTResizeModeStretch, integerValue)

@end
