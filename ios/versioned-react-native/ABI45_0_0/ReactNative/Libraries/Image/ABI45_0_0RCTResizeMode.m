/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTResizeMode.h>

@implementation ABI45_0_0RCTConvert(ABI45_0_0RCTResizeMode)

ABI45_0_0RCT_ENUM_CONVERTER(ABI45_0_0RCTResizeMode, (@{
  @"cover": @(ABI45_0_0RCTResizeModeCover),
  @"contain": @(ABI45_0_0RCTResizeModeContain),
  @"stretch": @(ABI45_0_0RCTResizeModeStretch),
  @"center": @(ABI45_0_0RCTResizeModeCenter),
  @"repeat": @(ABI45_0_0RCTResizeModeRepeat),
}), ABI45_0_0RCTResizeModeStretch, integerValue)

@end
