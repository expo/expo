/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI5_0_0RCTBridgeModule.h"
#import "ABI5_0_0RCTConvert.h"

@interface ABI5_0_0RCTConvert (UIStatusBar)

+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;

@end

@interface ABI5_0_0RCTStatusBarManager : NSObject <ABI5_0_0RCTBridgeModule>

@end
