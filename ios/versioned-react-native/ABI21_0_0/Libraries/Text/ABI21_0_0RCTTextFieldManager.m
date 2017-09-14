/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI21_0_0RCTTextFieldManager.h"

#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import <ReactABI21_0_0/ABI21_0_0RCTFont.h>
#import <ReactABI21_0_0/ABI21_0_0RCTShadowView+Layout.h>
#import <ReactABI21_0_0/ABI21_0_0RCTShadowView.h>

#import "ABI21_0_0RCTConvert+Text.h"
#import "ABI21_0_0RCTShadowTextField.h"
#import "ABI21_0_0RCTTextField.h"
#import "ABI21_0_0RCTUITextField.h"

@implementation ABI21_0_0RCTTextFieldManager

ABI21_0_0RCT_EXPORT_MODULE()

- (ABI21_0_0RCTShadowView *)shadowView
{
  return [ABI21_0_0RCTShadowTextField new];
}

- (UIView *)view
{
  return [[ABI21_0_0RCTTextField alloc] initWithBridge:self.bridge];
}

#pragma mark - Unified <TextInput> properties

ABI21_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(color, backedTextInputView.textColor, UIColor)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, backedTextInputView.keyboardType, UIKeyboardType)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, backedTextInputView.textAlignment, NSTextAlignment)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI21_0_0RCTTextSelection)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)

#pragma mark - Singleline <TextInput> (aka TextField) specific properties

ABI21_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI21_0_0RCTTextField)
{
  view.backedTextInputView.font = [ABI21_0_0RCTFont updateFont:view.backedTextInputView.font withSize:json ?: @(defaultView.backedTextInputView.font.pointSize)];
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI21_0_0RCTTextField)
{
  view.backedTextInputView.font = [ABI21_0_0RCTFont updateFont:view.backedTextInputView.font withWeight:json]; // defaults to normal
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI21_0_0RCTTextField)
{
  view.backedTextInputView.font = [ABI21_0_0RCTFont updateFont:view.backedTextInputView.font withStyle:json]; // defaults to normal
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI21_0_0RCTTextField)
{
  view.backedTextInputView.font = [ABI21_0_0RCTFont updateFont:view.backedTextInputView.font withFamily:json ?: defaultView.backedTextInputView.font.familyName];
}
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI21_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI21_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI21_0_0Tag = shadowView.ReactABI21_0_0Tag;
  UIEdgeInsets borderAsInsets = shadowView.borderAsInsets;
  UIEdgeInsets paddingAsInsets = shadowView.paddingAsInsets;
  return ^(ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI21_0_0RCTTextInput *> *viewRegistry) {
    ABI21_0_0RCTTextInput *view = viewRegistry[ReactABI21_0_0Tag];
    view.ReactABI21_0_0BorderInsets = borderAsInsets;
    view.ReactABI21_0_0PaddingInsets = paddingAsInsets;
  };
}

@end
