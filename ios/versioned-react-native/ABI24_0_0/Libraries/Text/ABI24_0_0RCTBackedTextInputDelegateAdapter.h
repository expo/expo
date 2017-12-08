/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI24_0_0RCTBackedTextInputViewProtocol.h"
#import "ABI24_0_0RCTBackedTextInputDelegate.h"

#pragma mark - ABI24_0_0RCTBackedTextFieldDelegateAdapter (for UITextField)

@interface ABI24_0_0RCTBackedTextFieldDelegateAdapter : NSObject

- (instancetype)initWithTextField:(UITextField<ABI24_0_0RCTBackedTextInputViewProtocol> *)backedTextInput;

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;
- (void)selectedTextRangeWasSet;

@end

#pragma mark - ABI24_0_0RCTBackedTextViewDelegateAdapter (for UITextView)

@interface ABI24_0_0RCTBackedTextViewDelegateAdapter : NSObject

- (instancetype)initWithTextView:(UITextView<ABI24_0_0RCTBackedTextInputViewProtocol> *)backedTextInput;

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;

@end
