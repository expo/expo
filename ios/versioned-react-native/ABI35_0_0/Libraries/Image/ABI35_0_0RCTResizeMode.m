/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTResizeMode.h"

@implementation ABI35_0_0RCTConvert(ABI35_0_0RCTResizeMode)

ABI35_0_0RCT_ENUM_CONVERTER(ABI35_0_0RCTResizeMode, (@{
  @"cover": @(ABI35_0_0RCTResizeModeCover),
  @"contain": @(ABI35_0_0RCTResizeModeContain),
  @"stretch": @(ABI35_0_0RCTResizeModeStretch),
  @"center": @(ABI35_0_0RCTResizeModeCenter),
  @"repeat": @(ABI35_0_0RCTResizeModeRepeat),
}), ABI35_0_0RCTResizeModeStretch, integerValue)

@end
