/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTConvert.h"

typedef NS_ENUM(NSInteger, ABI6_0_0RCTResizeMode) {
  ABI6_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI6_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI6_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
};

@interface ABI6_0_0RCTConvert(ABI6_0_0RCTResizeMode)

+ (ABI6_0_0RCTResizeMode)ABI6_0_0RCTResizeMode:(id)json;

@end
