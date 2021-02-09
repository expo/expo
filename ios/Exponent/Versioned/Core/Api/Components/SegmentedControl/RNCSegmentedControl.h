/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>

@interface RNCSegmentedControl : UISegmentedControl
@property(nonatomic, assign) NSInteger selectedIndex;
@property(nonatomic, copy) RCTBubblingEventBlock onChange;

@end
