/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTTextFieldManager.h"

#import "ABI12_0_0RCTBridge.h"
#import "ABI12_0_0RCTShadowView.h"
#import "ABI12_0_0RCTTextField.h"
#import "ABI12_0_0RCTFont.h"

@interface ABI12_0_0RCTTextFieldManager() <UITextFieldDelegate>

@end

@implementation ABI12_0_0RCTTextFieldManager

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI12_0_0RCTTextField *textField = [[ABI12_0_0RCTTextField alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
  textField.delegate = self;
  return textField;
}

- (BOOL)textField:(ABI12_0_0RCTTextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  // Only allow single keypresses for onKeyPress, pasted text will not be sent.
  if (textField.textWasPasted) {
    textField.textWasPasted = NO;
  } else {
    [textField sendKeyValueForString:string];
  }

  if (textField.maxLength == nil || [string isEqualToString:@"\n"]) {  // Make sure forms can be submitted via return
    return YES;
  }
  NSUInteger allowedLength = textField.maxLength.integerValue - MIN(textField.maxLength.integerValue, textField.text.length) + range.length;
  if (string.length > allowedLength) {
    if (string.length > 1) {
      // Truncate the input string so the result is exactly maxLength
      NSString *limitedString = [string substringToIndex:allowedLength];
      NSMutableString *newString = textField.text.mutableCopy;
      [newString replaceCharactersInRange:range withString:limitedString];
      textField.text = newString;
      // Collapse selection at end of insert to match normal paste behavior
      UITextPosition *insertEnd = [textField positionFromPosition:textField.beginningOfDocument
                                                          offset:(range.location + allowedLength)];
      textField.selectedTextRange = [textField textRangeFromPosition:insertEnd toPosition:insertEnd];
      [textField textFieldDidChange];
    }
    return NO;
  } else {
    return YES;
  }
}

// This method allows us to detect a `Backspace` keyPress
// even when there is no more text in the TextField
- (BOOL)keyboardInputShouldDelete:(ABI12_0_0RCTTextField *)textField
{
  [self textField:textField shouldChangeCharactersInRange:NSMakeRange(0, 0) replacementString:@""];
  return YES;
}

- (BOOL)textFieldShouldEndEditing:(ABI12_0_0RCTTextField *)textField
{
  return [textField textFieldShouldEndEditing:textField];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(caretHidden, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(editable, enabled, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI12_0_0RCTTextSelection)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(clearButtonMode, UITextFieldViewMode)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(clearTextOnFocus, clearsOnBeginEditing, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardAppearance, UIKeyboardAppearance)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(returnKeyType, UIReturnKeyType)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(enablesReturnKeyAutomatically, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(secureTextEntry, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(password, secureTextEntry, BOOL) // backwards compatibility
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(color, textColor, UIColor)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, autocapitalizationType, UITextAutocapitalizationType)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textAlignment, NSTextAlignment)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI12_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI12_0_0RCTTextField)
{
  view.font = [ABI12_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI12_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI12_0_0RCTTextField)
{
  view.font = [ABI12_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI12_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI12_0_0RCTTextField)
{
  view.font = [ABI12_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI12_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI12_0_0RCTTextField)
{
  view.font = [ABI12_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI12_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI12_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI12_0_0Tag = shadowView.ReactABI12_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI12_0_0RCTTextField *> *viewRegistry) {
    viewRegistry[ReactABI12_0_0Tag].contentInset = padding;
  };
}

@end
