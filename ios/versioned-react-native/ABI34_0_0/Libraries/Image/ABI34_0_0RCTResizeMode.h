/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI34_0_0RCTResizeMode) {
  ABI34_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI34_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI34_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI34_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI34_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI34_0_0RCTConvert(ABI34_0_0RCTResizeMode)

+ (ABI34_0_0RCTResizeMode)ABI34_0_0RCTResizeMode:(id)json;

@end
