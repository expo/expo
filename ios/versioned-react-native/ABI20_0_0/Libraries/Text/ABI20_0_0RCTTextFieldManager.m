/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTTextFieldManager.h"

#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/ABI20_0_0RCTFont.h>
#import <ReactABI20_0_0/ABI20_0_0RCTShadowView+Layout.h>
#import <ReactABI20_0_0/ABI20_0_0RCTShadowView.h>

#import "ABI20_0_0RCTConvert+Text.h"
#import "ABI20_0_0RCTShadowTextField.h"
#import "ABI20_0_0RCTTextField.h"
#import "ABI20_0_0RCTUITextField.h"

@implementation ABI20_0_0RCTTextFieldManager

ABI20_0_0RCT_EXPORT_MODULE()

- (ABI20_0_0RCTShadowView *)shadowView
{
  return [ABI20_0_0RCTShadowTextField new];
}

- (UIView *)view
{
  return [[ABI20_0_0RCTTextField alloc] initWithBridge:self.bridge];
}

#pragma mark - Unified <TextInput> properties

ABI20_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(color, backedTextInputView.textColor, UIColor)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, backedTextInputView.keyboardType, UIKeyboardType)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, backedTextInputView.textAlignment, NSTextAlignment)

#pragma mark - Singleline <TextInput> (aka TextField) specific properties

ABI20_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, textField.caretHidden, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI20_0_0RCTTextSelection)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, textField.clearButtonMode, UITextFieldViewMode)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(clearTextOnFocus, textField.clearsOnBeginEditing, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI20_0_0RCTTextField)
{
  view.textField.font = [ABI20_0_0RCTFont updateFont:view.textField.font withSize:json ?: @(defaultView.textField.font.pointSize)];
}
ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI20_0_0RCTTextField)
{
  view.textField.font = [ABI20_0_0RCTFont updateFont:view.textField.font withWeight:json]; // defaults to normal
}
ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI20_0_0RCTTextField)
{
  view.textField.font = [ABI20_0_0RCTFont updateFont:view.textField.font withStyle:json]; // defaults to normal
}
ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI20_0_0RCTTextField)
{
  view.textField.font = [ABI20_0_0RCTFont updateFont:view.textField.font withFamily:json ?: defaultView.textField.font.familyName];
}
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI20_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI20_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI20_0_0Tag = shadowView.ReactABI20_0_0Tag;
  UIEdgeInsets borderAsInsets = shadowView.borderAsInsets;
  UIEdgeInsets paddingAsInsets = shadowView.paddingAsInsets;
  return ^(ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI20_0_0RCTTextInput *> *viewRegistry) {
    ABI20_0_0RCTTextInput *view = viewRegistry[ReactABI20_0_0Tag];
    view.ReactABI20_0_0BorderInsets = borderAsInsets;
    view.ReactABI20_0_0PaddingInsets = paddingAsInsets;
  };
}

@end
