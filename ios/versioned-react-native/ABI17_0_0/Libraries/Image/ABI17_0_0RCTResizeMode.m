/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTResizeMode.h"

@implementation ABI17_0_0RCTConvert(ABI17_0_0RCTResizeMode)

ABI17_0_0RCT_ENUM_CONVERTER(ABI17_0_0RCTResizeMode, (@{
  @"cover": @(ABI17_0_0RCTResizeModeCover),
  @"contain": @(ABI17_0_0RCTResizeModeContain),
  @"stretch": @(ABI17_0_0RCTResizeModeStretch),
  @"center": @(ABI17_0_0RCTResizeModeCenter),
  @"repeat": @(ABI17_0_0RCTResizeModeRepeat),
}), ABI17_0_0RCTResizeModeStretch, integerValue)

@end
