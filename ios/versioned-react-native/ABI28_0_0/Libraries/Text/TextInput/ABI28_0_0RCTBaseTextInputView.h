/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI28_0_0/ABI28_0_0RCTView.h>

#import "ABI28_0_0RCTBackedTextInputDelegate.h"
#import "ABI28_0_0RCTBackedTextInputViewProtocol.h"

@class ABI28_0_0RCTBridge;
@class ABI28_0_0RCTEventDispatcher;
@class ABI28_0_0RCTTextAttributes;
@class ABI28_0_0RCTTextSelection;

NS_ASSUME_NONNULL_BEGIN

@interface ABI28_0_0RCTBaseTextInputView : ABI28_0_0RCTView <ABI28_0_0RCTBackedTextInputDelegate>

- (instancetype)initWithBridge:(ABI28_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, readonly) UIView<ABI28_0_0RCTBackedTextInputViewProtocol> *backedTextInputView;

@property (nonatomic, strong, nullable) ABI28_0_0RCTTextAttributes *textAttributes;
@property (nonatomic, assign) UIEdgeInsets ReactABI28_0_0PaddingInsets;
@property (nonatomic, assign) UIEdgeInsets ReactABI28_0_0BorderInsets;

@property (nonatomic, copy, nullable) ABI28_0_0RCTDirectEventBlock onContentSizeChange;
@property (nonatomic, copy, nullable) ABI28_0_0RCTDirectEventBlock onSelectionChange;
@property (nonatomic, copy, nullable) ABI28_0_0RCTDirectEventBlock onChange;
@property (nonatomic, copy, nullable) ABI28_0_0RCTDirectEventBlock onTextInput;
@property (nonatomic, copy, nullable) ABI28_0_0RCTDirectEventBlock onScroll;

@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, copy) ABI28_0_0RCTTextSelection *selection;
@property (nonatomic, strong, nullable) NSNumber *maxLength;
@property (nonatomic, copy) NSAttributedString *attributedText;
@property (nonatomic, copy) NSString *inputAccessoryViewID;

@end

NS_ASSUME_NONNULL_END
