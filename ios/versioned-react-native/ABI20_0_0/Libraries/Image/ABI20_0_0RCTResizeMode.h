/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI20_0_0RCTResizeMode) {
  ABI20_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI20_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI20_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI20_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI20_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI20_0_0RCTConvert(ABI20_0_0RCTResizeMode)

+ (ABI20_0_0RCTResizeMode)ABI20_0_0RCTResizeMode:(id)json;

@end
