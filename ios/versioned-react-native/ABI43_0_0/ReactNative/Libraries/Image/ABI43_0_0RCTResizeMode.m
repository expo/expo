/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTResizeMode.h>

@implementation ABI43_0_0RCTConvert(ABI43_0_0RCTResizeMode)

ABI43_0_0RCT_ENUM_CONVERTER(ABI43_0_0RCTResizeMode, (@{
  @"cover": @(ABI43_0_0RCTResizeModeCover),
  @"contain": @(ABI43_0_0RCTResizeModeContain),
  @"stretch": @(ABI43_0_0RCTResizeModeStretch),
  @"center": @(ABI43_0_0RCTResizeModeCenter),
  @"repeat": @(ABI43_0_0RCTResizeModeRepeat),
}), ABI43_0_0RCTResizeModeStretch, integerValue)

@end
