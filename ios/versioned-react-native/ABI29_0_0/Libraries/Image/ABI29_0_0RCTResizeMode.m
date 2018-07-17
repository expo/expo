/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTResizeMode.h"

@implementation ABI29_0_0RCTConvert(ABI29_0_0RCTResizeMode)

ABI29_0_0RCT_ENUM_CONVERTER(ABI29_0_0RCTResizeMode, (@{
  @"cover": @(ABI29_0_0RCTResizeModeCover),
  @"contain": @(ABI29_0_0RCTResizeModeContain),
  @"stretch": @(ABI29_0_0RCTResizeModeStretch),
  @"center": @(ABI29_0_0RCTResizeModeCenter),
  @"repeat": @(ABI29_0_0RCTResizeModeRepeat),
}), ABI29_0_0RCTResizeModeStretch, integerValue)

@end
