/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "ABI48_0_0RCTBackedTextInputDelegate.h"
#import "ABI48_0_0RCTBackedTextInputViewProtocol.h"

NS_ASSUME_NONNULL_BEGIN

#pragma mark - ABI48_0_0RCTBackedTextFieldDelegateAdapter (for UITextField)

@interface ABI48_0_0RCTBackedTextFieldDelegateAdapter : NSObject

- (instancetype)initWithTextField:(UITextField<ABI48_0_0RCTBackedTextInputViewProtocol> *)backedTextInputView;

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;
- (void)selectedTextRangeWasSet;

@end

#pragma mark - ABI48_0_0RCTBackedTextViewDelegateAdapter (for UITextView)

@interface ABI48_0_0RCTBackedTextViewDelegateAdapter : NSObject

- (instancetype)initWithTextView:(UITextView<ABI48_0_0RCTBackedTextInputViewProtocol> *)backedTextInputView;

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;

@end

NS_ASSUME_NONNULL_END
