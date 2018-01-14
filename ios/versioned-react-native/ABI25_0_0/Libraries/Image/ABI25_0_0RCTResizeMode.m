/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTResizeMode.h"

@implementation ABI25_0_0RCTConvert(ABI25_0_0RCTResizeMode)

ABI25_0_0RCT_ENUM_CONVERTER(ABI25_0_0RCTResizeMode, (@{
  @"cover": @(ABI25_0_0RCTResizeModeCover),
  @"contain": @(ABI25_0_0RCTResizeModeContain),
  @"stretch": @(ABI25_0_0RCTResizeModeStretch),
  @"center": @(ABI25_0_0RCTResizeModeCenter),
  @"repeat": @(ABI25_0_0RCTResizeModeRepeat),
}), ABI25_0_0RCTResizeModeStretch, integerValue)

@end
