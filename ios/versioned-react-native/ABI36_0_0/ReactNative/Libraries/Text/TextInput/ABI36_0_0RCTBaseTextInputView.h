/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI36_0_0React/ABI36_0_0RCTView.h>

#import "ABI36_0_0RCTBackedTextInputDelegate.h"
#import "ABI36_0_0RCTBackedTextInputViewProtocol.h"

@class ABI36_0_0RCTBridge;
@class ABI36_0_0RCTEventDispatcher;
@class ABI36_0_0RCTTextAttributes;
@class ABI36_0_0RCTTextSelection;

NS_ASSUME_NONNULL_BEGIN

@interface ABI36_0_0RCTBaseTextInputView : ABI36_0_0RCTView <ABI36_0_0RCTBackedTextInputDelegate>

- (instancetype)initWithBridge:(ABI36_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, readonly) UIView<ABI36_0_0RCTBackedTextInputViewProtocol> *backedTextInputView;

@property (nonatomic, strong, nullable) ABI36_0_0RCTTextAttributes *textAttributes;
@property (nonatomic, assign) UIEdgeInsets ABI36_0_0ReactPaddingInsets;
@property (nonatomic, assign) UIEdgeInsets ABI36_0_0ReactBorderInsets;

@property (nonatomic, copy, nullable) ABI36_0_0RCTDirectEventBlock onContentSizeChange;
@property (nonatomic, copy, nullable) ABI36_0_0RCTDirectEventBlock onSelectionChange;
@property (nonatomic, copy, nullable) ABI36_0_0RCTDirectEventBlock onChange;
@property (nonatomic, copy, nullable) ABI36_0_0RCTDirectEventBlock onTextInput;
@property (nonatomic, copy, nullable) ABI36_0_0RCTDirectEventBlock onScroll;

@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, assign) BOOL secureTextEntry;
@property (nonatomic, copy) ABI36_0_0RCTTextSelection *selection;
@property (nonatomic, strong, nullable) NSNumber *maxLength;
@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
@property (nonatomic, copy) NSString *inputAccessoryViewID;
@property (nonatomic, assign) UIKeyboardType keyboardType;

@end

NS_ASSUME_NONNULL_END
