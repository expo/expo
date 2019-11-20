/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0RCTResizeMode.h>

@implementation ABI36_0_0RCTConvert(ABI36_0_0RCTResizeMode)

ABI36_0_0RCT_ENUM_CONVERTER(ABI36_0_0RCTResizeMode, (@{
  @"cover": @(ABI36_0_0RCTResizeModeCover),
  @"contain": @(ABI36_0_0RCTResizeModeContain),
  @"stretch": @(ABI36_0_0RCTResizeModeStretch),
  @"center": @(ABI36_0_0RCTResizeModeCenter),
  @"repeat": @(ABI36_0_0RCTResizeModeRepeat),
}), ABI36_0_0RCTResizeModeStretch, integerValue)

@end
