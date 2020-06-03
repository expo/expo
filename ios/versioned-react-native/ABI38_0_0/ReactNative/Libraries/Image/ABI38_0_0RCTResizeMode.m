/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTResizeMode.h>

@implementation ABI38_0_0RCTConvert(ABI38_0_0RCTResizeMode)

ABI38_0_0RCT_ENUM_CONVERTER(ABI38_0_0RCTResizeMode, (@{
  @"cover": @(ABI38_0_0RCTResizeModeCover),
  @"contain": @(ABI38_0_0RCTResizeModeContain),
  @"stretch": @(ABI38_0_0RCTResizeModeStretch),
  @"center": @(ABI38_0_0RCTResizeModeCenter),
  @"repeat": @(ABI38_0_0RCTResizeModeRepeat),
}), ABI38_0_0RCTResizeModeStretch, integerValue)

@end
