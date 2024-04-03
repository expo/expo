/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/UIView+React.h>

#import "RNCPickerLabel.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCPickerComponentView.h"
#endif

@interface RNCPicker : UIPickerView <UIPickerViewDataSource, UIPickerViewDelegate>

@property (nonatomic, copy) NSArray<NSDictionary *> *items;
@property (nonatomic, assign) NSInteger selectedIndex;
@property (nonatomic, assign) NSInteger selectionColor;

@property (nonatomic, strong) UIColor *color;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, assign) NSTextAlignment textAlign;

@property (nonatomic, assign) NSInteger numberOfLines;

@property (nonatomic, copy) RCTBubblingEventBlock onChange;

#ifdef RCT_NEW_ARCH_ENABLED
- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row inComponent:(__unused NSInteger)component
  withEventEmitter:(facebook::react::SharedViewEventEmitter)eventEmitter;
#endif

@end
