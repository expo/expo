/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTResizeMode.h"

@implementation ABI6_0_0RCTConvert(ABI6_0_0RCTResizeMode)

ABI6_0_0RCT_ENUM_CONVERTER(ABI6_0_0RCTResizeMode, (@{
  @"cover": @(ABI6_0_0RCTResizeModeCover),
  @"contain": @(ABI6_0_0RCTResizeModeContain),
  @"stretch": @(ABI6_0_0RCTResizeModeStretch),
}), ABI6_0_0RCTResizeModeStretch, integerValue)

@end
