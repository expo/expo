/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI49_0_0RCTResizeMode) {
  ABI49_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI49_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI49_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI49_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI49_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI49_0_0RCTConvert (ABI49_0_0RCTResizeMode)

+ (ABI49_0_0RCTResizeMode)ABI49_0_0RCTResizeMode:(id)json;

@end
