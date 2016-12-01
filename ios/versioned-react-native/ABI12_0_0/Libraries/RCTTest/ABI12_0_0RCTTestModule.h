/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI12_0_0RCTBridgeModule.h"
#import "ABI12_0_0RCTDefines.h"

typedef NS_ENUM(NSInteger, ABI12_0_0RCTTestStatus) {
  ABI12_0_0RCTTestStatusPending = 0,
  ABI12_0_0RCTTestStatusPassed,
  ABI12_0_0RCTTestStatusFailed
};

@class FBSnapshotTestController;

@interface ABI12_0_0RCTTestModule : NSObject <ABI12_0_0RCTBridgeModule>

/**
 * The snapshot test controller for this module.
 */
@property (nonatomic, strong) FBSnapshotTestController *controller;

/**
 * This is the view to be snapshotted.
 */
@property (nonatomic, strong) UIView *view;

/**
 * This is used to give meaningful names to snapshot image files.
 */
@property (nonatomic, assign) SEL testSelector;

/**
 * This is polled while running the runloop until true.
 */
@property (nonatomic, readonly) ABI12_0_0RCTTestStatus status;

@property (nonatomic, copy) NSString *testSuffix;

@end
