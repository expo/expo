/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTResizeMode.h>

@implementation ABI41_0_0RCTConvert(ABI41_0_0RCTResizeMode)

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0RCTResizeMode, (@{
  @"cover": @(ABI41_0_0RCTResizeModeCover),
  @"contain": @(ABI41_0_0RCTResizeModeContain),
  @"stretch": @(ABI41_0_0RCTResizeModeStretch),
  @"center": @(ABI41_0_0RCTResizeModeCenter),
  @"repeat": @(ABI41_0_0RCTResizeModeRepeat),
}), ABI41_0_0RCTResizeModeStretch, integerValue)

@end
