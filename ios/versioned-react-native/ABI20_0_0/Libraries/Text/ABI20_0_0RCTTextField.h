/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI20_0_0/ABI20_0_0RCTComponent.h>
#import <ReactABI20_0_0/ABI20_0_0RCTView.h>

#import "ABI20_0_0RCTTextInput.h"

@class ABI20_0_0RCTUITextField;

@interface ABI20_0_0RCTTextField : ABI20_0_0RCTTextInput

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, strong) NSNumber *maxLength;

@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onSelectionChange;

@property (nonatomic, strong) ABI20_0_0RCTUITextField *textField;

@end
