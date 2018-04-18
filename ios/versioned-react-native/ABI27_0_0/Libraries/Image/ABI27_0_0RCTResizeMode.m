/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTResizeMode.h"

@implementation ABI27_0_0RCTConvert(ABI27_0_0RCTResizeMode)

ABI27_0_0RCT_ENUM_CONVERTER(ABI27_0_0RCTResizeMode, (@{
  @"cover": @(ABI27_0_0RCTResizeModeCover),
  @"contain": @(ABI27_0_0RCTResizeModeContain),
  @"stretch": @(ABI27_0_0RCTResizeModeStretch),
  @"center": @(ABI27_0_0RCTResizeModeCenter),
  @"repeat": @(ABI27_0_0RCTResizeModeRepeat),
}), ABI27_0_0RCTResizeModeStretch, integerValue)

@end
