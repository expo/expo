/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTResizeMode.h"

@implementation ABI34_0_0RCTConvert(ABI34_0_0RCTResizeMode)

ABI34_0_0RCT_ENUM_CONVERTER(ABI34_0_0RCTResizeMode, (@{
  @"cover": @(ABI34_0_0RCTResizeModeCover),
  @"contain": @(ABI34_0_0RCTResizeModeContain),
  @"stretch": @(ABI34_0_0RCTResizeModeStretch),
  @"center": @(ABI34_0_0RCTResizeModeCenter),
  @"repeat": @(ABI34_0_0RCTResizeModeRepeat),
}), ABI34_0_0RCTResizeModeStretch, integerValue)

@end
