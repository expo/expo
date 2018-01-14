/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTTextFieldManager.h"

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTFont.h>
#import <ReactABI25_0_0/ABI25_0_0RCTShadowView+Layout.h>
#import <ReactABI25_0_0/ABI25_0_0RCTShadowView.h>

#import "ABI25_0_0RCTConvert+Text.h"
#import "ABI25_0_0RCTShadowTextField.h"
#import "ABI25_0_0RCTTextField.h"
#import "ABI25_0_0RCTUITextField.h"

@implementation ABI25_0_0RCTTextFieldManager

ABI25_0_0RCT_EXPORT_MODULE()

- (ABI25_0_0RCTShadowView *)shadowView
{
  return [ABI25_0_0RCTShadowTextField new];
}

- (UIView *)view
{
  return [[ABI25_0_0RCTTextField alloc] initWithBridge:self.bridge];
}

#pragma mark - Unified <TextInput> properties

ABI25_0_0RCT_REMAP_VIEW_PROPERTY(allowFontScaling, fontAttributes.allowFontScaling, BOOL)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(color, backedTextInputView.textColor, UIColor)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(fontSize, fontAttributes.fontSize, NSNumber)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(fontWeight, fontAttributes.fontWeight, NSString)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(fontStyle, fontAttributes.fontStyle, NSString)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(fontFamily, fontAttributes.fontFamily, NSString)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, backedTextInputView.keyboardType, UIKeyboardType)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, backedTextInputView.textAlignment, NSTextAlignment)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI25_0_0RCTTextSelection)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)

#pragma mark - Singleline <TextInput> (aka TextField) specific properties

ABI25_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI25_0_0RCTDirectEventBlock)

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI25_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI25_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI25_0_0Tag = shadowView.ReactABI25_0_0Tag;
  UIEdgeInsets borderAsInsets = shadowView.borderAsInsets;
  UIEdgeInsets paddingAsInsets = shadowView.paddingAsInsets;
  return ^(ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI25_0_0RCTTextInput *> *viewRegistry) {
    ABI25_0_0RCTTextInput *view = viewRegistry[ReactABI25_0_0Tag];
    view.ReactABI25_0_0BorderInsets = borderAsInsets;
    view.ReactABI25_0_0PaddingInsets = paddingAsInsets;
  };
}

@end
