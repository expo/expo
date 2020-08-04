/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI37_0_0RCTResizeMode) {
  ABI37_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI37_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI37_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI37_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI37_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI37_0_0RCTConvert(ABI37_0_0RCTResizeMode)

+ (ABI37_0_0RCTResizeMode)ABI37_0_0RCTResizeMode:(id)json;

@end
