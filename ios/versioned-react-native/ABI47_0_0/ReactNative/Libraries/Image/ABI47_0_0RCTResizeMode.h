/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI47_0_0RCTResizeMode) {
  ABI47_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI47_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI47_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI47_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI47_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI47_0_0RCTConvert(ABI47_0_0RCTResizeMode)

+ (ABI47_0_0RCTResizeMode)ABI47_0_0RCTResizeMode:(id)json;

@end
