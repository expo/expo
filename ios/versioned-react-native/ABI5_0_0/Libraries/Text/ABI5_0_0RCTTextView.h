/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI5_0_0RCTView.h"
#import "UIView+ReactABI5_0_0.h"

@class ABI5_0_0RCTEventDispatcher;

@interface ABI5_0_0RCTTextView : ABI5_0_0RCTView <UITextViewDelegate>

@property (nonatomic, assign) BOOL autoCorrect;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, copy) NSString *text;
@property (nonatomic, strong) UIColor *placeholderTextColor;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, strong) NSNumber *maxLength;

@property (nonatomic, copy) ABI5_0_0RCTDirectEventBlock onSelectionChange;

- (instancetype)initWithEventDispatcher:(ABI5_0_0RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

- (void)performTextUpdate;

@end
