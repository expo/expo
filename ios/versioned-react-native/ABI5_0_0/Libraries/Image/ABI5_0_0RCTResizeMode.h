/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTConvert.h"

typedef NS_ENUM(NSInteger, ABI5_0_0RCTResizeMode) {
  ABI5_0_0RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  ABI5_0_0RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  ABI5_0_0RCTResizeModeStretch = UIViewContentModeScaleToFill,
};

@interface ABI5_0_0RCTConvert(ABI5_0_0RCTResizeMode)

+ (ABI5_0_0RCTResizeMode)ABI5_0_0RCTResizeMode:(id)json;

@end
