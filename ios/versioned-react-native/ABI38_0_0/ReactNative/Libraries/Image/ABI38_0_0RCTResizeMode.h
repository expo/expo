/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI38_0_0RCTResizeMode) {
  ABI38_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI38_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI38_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI38_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI38_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI38_0_0RCTConvert(ABI38_0_0RCTResizeMode)

+ (ABI38_0_0RCTResizeMode)ABI38_0_0RCTResizeMode:(id)json;

@end
