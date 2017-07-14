/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTTextFieldManager.h"

#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTFont.h>
#import <ReactABI19_0_0/ABI19_0_0RCTShadowView+Layout.h>
#import <ReactABI19_0_0/ABI19_0_0RCTShadowView.h>

#import "ABI19_0_0RCTConvert+Text.h"
#import "ABI19_0_0RCTShadowTextField.h"
#import "ABI19_0_0RCTTextField.h"
#import "ABI19_0_0RCTUITextField.h"

@implementation ABI19_0_0RCTTextFieldManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0RCTShadowView *)shadowView
{
  return [ABI19_0_0RCTShadowTextField new];
}

- (UIView *)view
{
  return [[ABI19_0_0RCTTextField alloc] initWithBridge:self.bridge];
}

ABI19_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, textField.caretHidden, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, textField.autocorrectionType, UITextAutocorrectionType)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, textField.spellCheckingType, UITextSpellCheckingType)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(editable, textField.enabled, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, textField.placeholder, NSString)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, textField.placeholderColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI19_0_0RCTTextSelection)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, textField.clearButtonMode, UITextFieldViewMode)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(clearTextOnFocus, textField.clearsOnBeginEditing, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textField.keyboardType, UIKeyboardType)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textField.keyboardAppearance, UIKeyboardAppearance)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textField.returnKeyType, UIReturnKeyType)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textField.enablesReturnKeyAutomatically, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textField.secureTextEntry, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(password, textField.secureTextEntry, BOOL) // backwards compatibility
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(color, textField.textColor, UIColor)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textField.autocapitalizationType, UITextAutocapitalizationType)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textField.textAlignment, NSTextAlignment)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, textField.tintColor, UIColor)
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI19_0_0RCTTextField)
{
  view.textField.font = [ABI19_0_0RCTFont updateFont:view.textField.font withSize:json ?: @(defaultView.textField.font.pointSize)];
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI19_0_0RCTTextField)
{
  view.textField.font = [ABI19_0_0RCTFont updateFont:view.textField.font withWeight:json]; // defaults to normal
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI19_0_0RCTTextField)
{
  view.textField.font = [ABI19_0_0RCTFont updateFont:view.textField.font withStyle:json]; // defaults to normal
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI19_0_0RCTTextField)
{
  view.textField.font = [ABI19_0_0RCTFont updateFont:view.textField.font withFamily:json ?: defaultView.textField.font.familyName];
}
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI19_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI19_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI19_0_0Tag = shadowView.ReactABI19_0_0Tag;
  UIEdgeInsets paddingAsInsets = shadowView.paddingAsInsets;
  UIEdgeInsets borderAsInsets = shadowView.borderAsInsets;
  return ^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI19_0_0RCTTextField *> *viewRegistry) {
    ABI19_0_0RCTTextField *textField = viewRegistry[ReactABI19_0_0Tag];
    textField.ReactABI19_0_0PaddingInsets = paddingAsInsets;
    textField.ReactABI19_0_0BorderInsets = borderAsInsets;
  };
}

@end
