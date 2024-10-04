/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol ABI42_0_0RCTBackedTextInputViewProtocol;

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0RCTBackedTextInputDelegate <NSObject>

- (BOOL)textInputShouldBeginEditing; // Return `NO` to disallow editing.
- (void)textInputDidBeginEditing;

- (BOOL)textInputShouldEndEditing; // Return `YES` to allow editing to stop and to resign first responder status. `NO` to disallow the editing session to end.
- (void)textInputDidEndEditing; // May be called if forced even if `textInputShouldEndEditing` returns `NO` (e.g. view removed from window) or `[textInput endEditing:YES]` called.

- (BOOL)textInputShouldReturn; // May be called right before `textInputShouldEndEditing` if "Return" button was pressed.
- (void)textInputDidReturn;

/*
 * Called before any change in the TextInput. The delegate has the opportunity to change the replacement string or reject the change completely.
 * To change the replacement, return the changed version of the `text`.
 * To accept the change, return `text` argument as-is.
 * To reject the change, return `nil`.
 */
- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range;
- (void)textInputDidChange;

- (void)textInputDidChangeSelection;

@optional

- (void)scrollViewDidScroll:(UIScrollView *)scrollView;

@end

NS_ASSUME_NONNULL_END
