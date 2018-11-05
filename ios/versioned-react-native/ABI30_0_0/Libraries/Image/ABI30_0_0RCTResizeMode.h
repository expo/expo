/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI30_0_0RCTResizeMode) {
  ABI30_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI30_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI30_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI30_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI30_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI30_0_0RCTConvert(ABI30_0_0RCTResizeMode)

+ (ABI30_0_0RCTResizeMode)ABI30_0_0RCTResizeMode:(id)json;

@end
