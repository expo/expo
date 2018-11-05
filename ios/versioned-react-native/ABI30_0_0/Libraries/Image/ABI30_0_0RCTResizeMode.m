/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTResizeMode.h"

@implementation ABI30_0_0RCTConvert(ABI30_0_0RCTResizeMode)

ABI30_0_0RCT_ENUM_CONVERTER(ABI30_0_0RCTResizeMode, (@{
  @"cover": @(ABI30_0_0RCTResizeModeCover),
  @"contain": @(ABI30_0_0RCTResizeModeContain),
  @"stretch": @(ABI30_0_0RCTResizeModeStretch),
  @"center": @(ABI30_0_0RCTResizeModeCenter),
  @"repeat": @(ABI30_0_0RCTResizeModeRepeat),
}), ABI30_0_0RCTResizeModeStretch, integerValue)

@end
