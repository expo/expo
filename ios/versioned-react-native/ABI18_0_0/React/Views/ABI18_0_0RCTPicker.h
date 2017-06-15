/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI18_0_0/UIView+ReactABI18_0_0.h>

@interface ABI18_0_0RCTPicker : UIPickerView

@property (nonatomic, copy) NSArray<NSDictionary *> *items;
@property (nonatomic, assign) NSInteger selectedIndex;

@property (nonatomic, strong) UIColor *color;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, assign) NSTextAlignment textAlign;

@property (nonatomic, copy) ABI18_0_0RCTBubblingEventBlock onChange;

@end
