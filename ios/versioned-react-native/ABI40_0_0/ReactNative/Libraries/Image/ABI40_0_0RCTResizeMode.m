/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTResizeMode.h>

@implementation ABI40_0_0RCTConvert(ABI40_0_0RCTResizeMode)

ABI40_0_0RCT_ENUM_CONVERTER(ABI40_0_0RCTResizeMode, (@{
  @"cover": @(ABI40_0_0RCTResizeModeCover),
  @"contain": @(ABI40_0_0RCTResizeModeContain),
  @"stretch": @(ABI40_0_0RCTResizeModeStretch),
  @"center": @(ABI40_0_0RCTResizeModeCenter),
  @"repeat": @(ABI40_0_0RCTResizeModeRepeat),
}), ABI40_0_0RCTResizeModeStretch, integerValue)

@end
