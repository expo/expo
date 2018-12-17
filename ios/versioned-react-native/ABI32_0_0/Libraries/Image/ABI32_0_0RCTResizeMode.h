/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI32_0_0RCTResizeMode) {
  ABI32_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI32_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI32_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI32_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI32_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI32_0_0RCTConvert(ABI32_0_0RCTResizeMode)

+ (ABI32_0_0RCTResizeMode)ABI32_0_0RCTResizeMode:(id)json;

@end
