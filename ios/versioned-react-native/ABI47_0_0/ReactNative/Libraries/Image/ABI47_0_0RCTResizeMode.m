/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTResizeMode.h>

@implementation ABI47_0_0RCTConvert(ABI47_0_0RCTResizeMode)

ABI47_0_0RCT_ENUM_CONVERTER(ABI47_0_0RCTResizeMode, (@{
  @"cover": @(ABI47_0_0RCTResizeModeCover),
  @"contain": @(ABI47_0_0RCTResizeModeContain),
  @"stretch": @(ABI47_0_0RCTResizeModeStretch),
  @"center": @(ABI47_0_0RCTResizeModeCenter),
  @"repeat": @(ABI47_0_0RCTResizeModeRepeat),
}), ABI47_0_0RCTResizeModeStretch, integerValue)

@end
