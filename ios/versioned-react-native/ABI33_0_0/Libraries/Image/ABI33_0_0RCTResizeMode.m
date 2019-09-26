/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTResizeMode.h"

@implementation ABI33_0_0RCTConvert(ABI33_0_0RCTResizeMode)

ABI33_0_0RCT_ENUM_CONVERTER(ABI33_0_0RCTResizeMode, (@{
  @"cover": @(ABI33_0_0RCTResizeModeCover),
  @"contain": @(ABI33_0_0RCTResizeModeContain),
  @"stretch": @(ABI33_0_0RCTResizeModeStretch),
  @"center": @(ABI33_0_0RCTResizeModeCenter),
  @"repeat": @(ABI33_0_0RCTResizeModeRepeat),
}), ABI33_0_0RCTResizeModeStretch, integerValue)

@end
