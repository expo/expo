/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTResizeMode.h"

@implementation ABI7_0_0RCTConvert(ABI7_0_0RCTResizeMode)

ABI7_0_0RCT_ENUM_CONVERTER(ABI7_0_0RCTResizeMode, (@{
  @"cover": @(ABI7_0_0RCTResizeModeCover),
  @"contain": @(ABI7_0_0RCTResizeModeContain),
  @"stretch": @(ABI7_0_0RCTResizeModeStretch),
}), ABI7_0_0RCTResizeModeStretch, integerValue)

@end
