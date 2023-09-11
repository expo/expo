/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTComponent.h>

@interface ABI48_0_0RCTSegmentedControl : UISegmentedControl

@property (nonatomic, copy) NSArray<NSString *> *values;
@property (nonatomic, assign) NSInteger selectedIndex;
@property (nonatomic, copy) ABI48_0_0RCTBubblingEventBlock onChange;

@end
