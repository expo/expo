/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI39_0_0RCTResizeMode) {
  ABI39_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI39_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI39_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
  ABI39_0_0RCTResizeModeCenter = UIViewContentModeCenter,
  ABI39_0_0RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface ABI39_0_0RCTConvert(ABI39_0_0RCTResizeMode)

+ (ABI39_0_0RCTResizeMode)ABI39_0_0RCTResizeMode:(id)json;

@end
