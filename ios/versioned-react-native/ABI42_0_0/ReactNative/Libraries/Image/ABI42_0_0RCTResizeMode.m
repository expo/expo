/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTResizeMode.h>

@implementation ABI42_0_0RCTConvert(ABI42_0_0RCTResizeMode)

ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0RCTResizeMode, (@{
  @"cover": @(ABI42_0_0RCTResizeModeCover),
  @"contain": @(ABI42_0_0RCTResizeModeContain),
  @"stretch": @(ABI42_0_0RCTResizeModeStretch),
  @"center": @(ABI42_0_0RCTResizeModeCenter),
  @"repeat": @(ABI42_0_0RCTResizeModeRepeat),
}), ABI42_0_0RCTResizeModeStretch, integerValue)

@end
