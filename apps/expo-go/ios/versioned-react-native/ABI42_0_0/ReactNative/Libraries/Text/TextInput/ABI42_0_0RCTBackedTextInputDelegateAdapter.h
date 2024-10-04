/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "ABI42_0_0RCTBackedTextInputViewProtocol.h"
#import "ABI42_0_0RCTBackedTextInputDelegate.h"

NS_ASSUME_NONNULL_BEGIN

#pragma mark - ABI42_0_0RCTBackedTextFieldDelegateAdapter (for UITextField)

@interface ABI42_0_0RCTBackedTextFieldDelegateAdapter : NSObject

- (instancetype)initWithTextField:(UITextField<ABI42_0_0RCTBackedTextInputViewProtocol> *)backedTextInputView;

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;
- (void)selectedTextRangeWasSet;

@end

#pragma mark - ABI42_0_0RCTBackedTextViewDelegateAdapter (for UITextView)

@interface ABI42_0_0RCTBackedTextViewDelegateAdapter : NSObject

- (instancetype)initWithTextView:(UITextView<ABI42_0_0RCTBackedTextInputViewProtocol> *)backedTextInputView;

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;

@end

NS_ASSUME_NONNULL_END
