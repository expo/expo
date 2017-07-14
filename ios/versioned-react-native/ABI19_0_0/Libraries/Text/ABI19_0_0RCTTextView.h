/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI19_0_0/ABI19_0_0RCTView.h>
#import <ReactABI19_0_0/UIView+ReactABI19_0_0.h>

@class ABI19_0_0RCTBridge;

@interface ABI19_0_0RCTTextView : ABI19_0_0RCTView <UITextViewDelegate>

@property (nonatomic, assign) UITextAutocorrectionType autocorrectionType;
@property (nonatomic, assign) UITextSpellCheckingType spellCheckingType;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, copy) NSString *text;
@property (nonatomic, strong) UIColor *placeholderTextColor;
@property (nonatomic, copy) NSString *placeholder;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, strong) NSNumber *maxLength;
@property (nonatomic, assign, readonly) CGSize contentSize;
@property (nonatomic, assign) UIEdgeInsets ReactABI19_0_0PaddingInsets;
@property (nonatomic, assign) UIEdgeInsets ReactABI19_0_0BorderInsets;

@property (nonatomic, copy) ABI19_0_0RCTDirectEventBlock onChange;
@property (nonatomic, copy) ABI19_0_0RCTDirectEventBlock onContentSizeChange;
@property (nonatomic, copy) ABI19_0_0RCTDirectEventBlock onSelectionChange;
@property (nonatomic, copy) ABI19_0_0RCTDirectEventBlock onTextInput;
@property (nonatomic, copy) ABI19_0_0RCTDirectEventBlock onScroll;

- (instancetype)initWithBridge:(ABI19_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)performTextUpdate;

@end
