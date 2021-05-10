/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTResizeMode.h>

@implementation ABI39_0_0RCTConvert(ABI39_0_0RCTResizeMode)

ABI39_0_0RCT_ENUM_CONVERTER(ABI39_0_0RCTResizeMode, (@{
  @"cover": @(ABI39_0_0RCTResizeModeCover),
  @"contain": @(ABI39_0_0RCTResizeModeContain),
  @"stretch": @(ABI39_0_0RCTResizeModeStretch),
  @"center": @(ABI39_0_0RCTResizeModeCenter),
  @"repeat": @(ABI39_0_0RCTResizeModeRepeat),
}), ABI39_0_0RCTResizeModeStretch, integerValue)

@end
