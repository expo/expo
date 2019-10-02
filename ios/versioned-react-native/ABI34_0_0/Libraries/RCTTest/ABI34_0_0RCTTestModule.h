/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>
#import <ReactABI34_0_0/ABI34_0_0RCTDefines.h>

typedef NS_ENUM(NSInteger, ABI34_0_0RCTTestStatus) {
  ABI34_0_0RCTTestStatusPending = 0,
  ABI34_0_0RCTTestStatusPassed,
  ABI34_0_0RCTTestStatusFailed
};

@class FBSnapshotTestController;

@interface ABI34_0_0RCTTestModule : NSObject <ABI34_0_0RCTBridgeModule>

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
@property (nonatomic, readonly) ABI34_0_0RCTTestStatus status;

@property (nonatomic, copy) NSString *testSuffix;

@end
