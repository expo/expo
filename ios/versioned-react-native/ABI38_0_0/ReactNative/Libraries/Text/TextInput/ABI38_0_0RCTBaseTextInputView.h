/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTView.h>

#import "ABI38_0_0RCTBackedTextInputDelegate.h"
#import "ABI38_0_0RCTBackedTextInputViewProtocol.h"

@class ABI38_0_0RCTBridge;
@class ABI38_0_0RCTEventDispatcher;
@class ABI38_0_0RCTTextAttributes;
@class ABI38_0_0RCTTextSelection;

NS_ASSUME_NONNULL_BEGIN

@interface ABI38_0_0RCTBaseTextInputView : ABI38_0_0RCTView <ABI38_0_0RCTBackedTextInputDelegate>

- (instancetype)initWithBridge:(ABI38_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, readonly) UIView<ABI38_0_0RCTBackedTextInputViewProtocol> *backedTextInputView;

@property (nonatomic, strong, nullable) ABI38_0_0RCTTextAttributes *textAttributes;
@property (nonatomic, assign) UIEdgeInsets ABI38_0_0ReactPaddingInsets;
@property (nonatomic, assign) UIEdgeInsets ABI38_0_0ReactBorderInsets;

@property (nonatomic, copy, nullable) ABI38_0_0RCTDirectEventBlock onContentSizeChange;
@property (nonatomic, copy, nullable) ABI38_0_0RCTDirectEventBlock onSelectionChange;
@property (nonatomic, copy, nullable) ABI38_0_0RCTDirectEventBlock onChange;
@property (nonatomic, copy, nullable) ABI38_0_0RCTDirectEventBlock onTextInput;
@property (nonatomic, copy, nullable) ABI38_0_0RCTDirectEventBlock onScroll;

@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, assign) BOOL autoFocus;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, assign) BOOL secureTextEntry;
@property (nonatomic, copy) ABI38_0_0RCTTextSelection *selection;
@property (nonatomic, strong, nullable) NSNumber *maxLength;
@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
@property (nonatomic, copy) NSString *inputAccessoryViewID;
@property (nonatomic, assign) UIKeyboardType keyboardType;

@end

NS_ASSUME_NONNULL_END
