/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI36_0_0RCTResizeMode) {
  ABI36_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI36_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI36_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI36_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI36_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI36_0_0RCTConvert(ABI36_0_0RCTResizeMode)

+ (ABI36_0_0RCTResizeMode)ABI36_0_0RCTResizeMode:(id)json;

@end
