/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTResizeMode.h>

@implementation ABI37_0_0RCTConvert(ABI37_0_0RCTResizeMode)

ABI37_0_0RCT_ENUM_CONVERTER(ABI37_0_0RCTResizeMode, (@{
  @"cover": @(ABI37_0_0RCTResizeModeCover),
  @"contain": @(ABI37_0_0RCTResizeModeContain),
  @"stretch": @(ABI37_0_0RCTResizeModeStretch),
  @"center": @(ABI37_0_0RCTResizeModeCenter),
  @"repeat": @(ABI37_0_0RCTResizeModeRepeat),
}), ABI37_0_0RCTResizeModeStretch, integerValue)

@end
