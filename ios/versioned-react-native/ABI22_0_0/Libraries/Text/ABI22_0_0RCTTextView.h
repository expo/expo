/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI22_0_0/ABI22_0_0RCTView.h>
#import <ReactABI22_0_0/UIView+ReactABI22_0_0.h>

#import "ABI22_0_0RCTTextInput.h"

@class ABI22_0_0RCTBridge;

@interface ABI22_0_0RCTTextView : ABI22_0_0RCTTextInput

@property (nonatomic, assign) UITextAutocorrectionType autocorrectionType;
@property (nonatomic, assign) UITextSpellCheckingType spellCheckingType;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, copy) NSString *text;
@property (nonatomic, strong) UIColor *placeholderTextColor;
@property (nonatomic, copy) NSString *placeholder;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, strong) NSNumber *maxLength;

@property (nonatomic, copy) ABI22_0_0RCTDirectEventBlock onChange;
@property (nonatomic, copy) ABI22_0_0RCTDirectEventBlock onTextInput;
@property (nonatomic, copy) ABI22_0_0RCTDirectEventBlock onScroll;

- (void)performTextUpdate;

@end
