/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTResizeMode.h>

@implementation ABI48_0_0RCTConvert (ABI48_0_0RCTResizeMode)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0RCTResizeMode,
    (@{
      @"cover" : @(ABI48_0_0RCTResizeModeCover),
      @"contain" : @(ABI48_0_0RCTResizeModeContain),
      @"stretch" : @(ABI48_0_0RCTResizeModeStretch),
      @"center" : @(ABI48_0_0RCTResizeModeCenter),
      @"repeat" : @(ABI48_0_0RCTResizeModeRepeat),
    }),
    ABI48_0_0RCTResizeModeStretch,
    integerValue)

@end
