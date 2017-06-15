/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTTextFieldManager.h"

#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>
#import <ReactABI18_0_0/ABI18_0_0RCTFont.h>
#import <ReactABI18_0_0/ABI18_0_0RCTShadowView+Layout.h>
#import <ReactABI18_0_0/ABI18_0_0RCTShadowView.h>

#import "ABI18_0_0RCTConvert+Text.h"
#import "ABI18_0_0RCTShadowTextField.h"
#import "ABI18_0_0RCTTextField.h"


@implementation ABI18_0_0RCTTextFieldManager

ABI18_0_0RCT_EXPORT_MODULE()

- (ABI18_0_0RCTShadowView *)shadowView
{
  return [ABI18_0_0RCTShadowTextField new];
}

- (UIView *)view
{
  return [[ABI18_0_0RCTTextField alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(caretHidden, BOOL)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, autocorrectionType, UITextAutocorrectionType)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, spellCheckingType, UITextSpellCheckingType)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(editable, enabled, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI18_0_0RCTTextSelection)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(clearButtonMode, UITextFieldViewMode)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(clearTextOnFocus, clearsOnBeginEditing, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardAppearance, UIKeyboardAppearance)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(returnKeyType, UIReturnKeyType)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(enablesReturnKeyAutomatically, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(secureTextEntry, BOOL)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(password, secureTextEntry, BOOL) // backwards compatibility
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(color, textColor, UIColor)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, autocapitalizationType, UITextAutocapitalizationType)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textAlignment, NSTextAlignment)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI18_0_0RCTTextField)
{
  view.font = [ABI18_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI18_0_0RCTTextField)
{
  view.font = [ABI18_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI18_0_0RCTTextField)
{
  view.font = [ABI18_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI18_0_0RCTTextField)
{
  view.font = [ABI18_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI18_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI18_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI18_0_0Tag = shadowView.ReactABI18_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI18_0_0RCTTextField *> *viewRegistry) {
    viewRegistry[ReactABI18_0_0Tag].contentInset = padding;
  };
}

@end
