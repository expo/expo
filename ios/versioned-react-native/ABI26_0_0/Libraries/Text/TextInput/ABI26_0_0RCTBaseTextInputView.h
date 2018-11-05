/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI26_0_0/ABI26_0_0RCTView.h>

#import "ABI26_0_0RCTBackedTextInputDelegate.h"
#import "ABI26_0_0RCTBackedTextInputViewProtocol.h"

@class ABI26_0_0RCTBridge;
@class ABI26_0_0RCTEventDispatcher;
@class ABI26_0_0RCTTextAttributes;
@class ABI26_0_0RCTTextSelection;

NS_ASSUME_NONNULL_BEGIN

@interface ABI26_0_0RCTBaseTextInputView : ABI26_0_0RCTView <ABI26_0_0RCTBackedTextInputDelegate>

- (instancetype)initWithBridge:(ABI26_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, readonly) UIView<ABI26_0_0RCTBackedTextInputViewProtocol> *backedTextInputView;

@property (nonatomic, strong, nullable) ABI26_0_0RCTTextAttributes *textAttributes;
@property (nonatomic, assign) UIEdgeInsets ReactABI26_0_0PaddingInsets;
@property (nonatomic, assign) UIEdgeInsets ReactABI26_0_0BorderInsets;

@property (nonatomic, copy, nullable) ABI26_0_0RCTDirectEventBlock onContentSizeChange;
@property (nonatomic, copy, nullable) ABI26_0_0RCTDirectEventBlock onSelectionChange;
@property (nonatomic, copy, nullable) ABI26_0_0RCTDirectEventBlock onChange;
@property (nonatomic, copy, nullable) ABI26_0_0RCTDirectEventBlock onTextInput;
@property (nonatomic, copy, nullable) ABI26_0_0RCTDirectEventBlock onScroll;

@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, copy) ABI26_0_0RCTTextSelection *selection;
@property (nonatomic, strong, nullable) NSNumber *maxLength;
@property (nonatomic, copy) NSAttributedString *attributedText;

@end

NS_ASSUME_NONNULL_END
