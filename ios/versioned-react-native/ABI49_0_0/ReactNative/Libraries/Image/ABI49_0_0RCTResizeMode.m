/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTResizeMode.h>

@implementation ABI49_0_0RCTConvert (ABI49_0_0RCTResizeMode)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0RCTResizeMode,
    (@{
      @"cover" : @(ABI49_0_0RCTResizeModeCover),
      @"contain" : @(ABI49_0_0RCTResizeModeContain),
      @"stretch" : @(ABI49_0_0RCTResizeModeStretch),
      @"center" : @(ABI49_0_0RCTResizeModeCenter),
      @"repeat" : @(ABI49_0_0RCTResizeModeRepeat),
    }),
    ABI49_0_0RCTResizeModeStretch,
    integerValue)

@end
