/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTResizeMode.h>

@implementation ABI46_0_0RCTConvert(ABI46_0_0RCTResizeMode)

ABI46_0_0RCT_ENUM_CONVERTER(ABI46_0_0RCTResizeMode, (@{
  @"cover": @(ABI46_0_0RCTResizeModeCover),
  @"contain": @(ABI46_0_0RCTResizeModeContain),
  @"stretch": @(ABI46_0_0RCTResizeModeStretch),
  @"center": @(ABI46_0_0RCTResizeModeCenter),
  @"repeat": @(ABI46_0_0RCTResizeModeRepeat),
}), ABI46_0_0RCTResizeModeStretch, integerValue)

@end
