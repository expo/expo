/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0UIView+React.h>

#import "ABI49_0_0RNCPickerLabel.h"

@interface ABI49_0_0RNCPicker : UIPickerView

@property (nonatomic, copy) NSArray<NSDictionary *> *items;
@property (nonatomic, assign) NSInteger selectedIndex;
@property (nonatomic, assign) NSInteger selectionColor;

@property (nonatomic, strong) UIColor *color;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, assign) NSTextAlignment textAlign;

@property (nonatomic, assign) NSInteger numberOfLines;

@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onChange;

@end
