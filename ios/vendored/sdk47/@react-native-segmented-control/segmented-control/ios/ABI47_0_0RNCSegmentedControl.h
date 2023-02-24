/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <ABI47_0_0React/ABI47_0_0RCTComponent.h>

@interface ABI47_0_0RNCSegmentedControl : UISegmentedControl
@property(nonatomic, assign) NSInteger selectedIndex;
@property(nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onChange;

@end
