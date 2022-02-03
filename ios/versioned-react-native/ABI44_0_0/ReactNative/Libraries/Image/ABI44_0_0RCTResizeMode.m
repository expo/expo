/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTResizeMode.h>

@implementation ABI44_0_0RCTConvert(ABI44_0_0RCTResizeMode)

ABI44_0_0RCT_ENUM_CONVERTER(ABI44_0_0RCTResizeMode, (@{
  @"cover": @(ABI44_0_0RCTResizeModeCover),
  @"contain": @(ABI44_0_0RCTResizeModeContain),
  @"stretch": @(ABI44_0_0RCTResizeModeStretch),
  @"center": @(ABI44_0_0RCTResizeModeCenter),
  @"repeat": @(ABI44_0_0RCTResizeModeRepeat),
}), ABI44_0_0RCTResizeModeStretch, integerValue)

@end
