/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTTextFieldManager.h"

#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTFont.h>
#import <ReactABI17_0_0/ABI17_0_0RCTShadowView.h>

#import "ABI17_0_0RCTConvert+Text.h"
#import "ABI17_0_0RCTShadowTextField.h"
#import "ABI17_0_0RCTTextField.h"


@implementation ABI17_0_0RCTTextFieldManager

ABI17_0_0RCT_EXPORT_MODULE()

- (ABI17_0_0RCTShadowView *)shadowView
{
  return [ABI17_0_0RCTShadowTextField new];
}

- (UIView *)view
{
  return [[ABI17_0_0RCTTextField alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(caretHidden, BOOL)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, autocorrectionType, UITextAutocorrectionType)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, spellCheckingType, UITextSpellCheckingType)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(editable, enabled, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI17_0_0RCTTextSelection)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(clearButtonMode, UITextFieldViewMode)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(clearTextOnFocus, clearsOnBeginEditing, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardAppearance, UIKeyboardAppearance)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(returnKeyType, UIReturnKeyType)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(enablesReturnKeyAutomatically, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(secureTextEntry, BOOL)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(password, secureTextEntry, BOOL) // backwards compatibility
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(color, textColor, UIColor)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, autocapitalizationType, UITextAutocapitalizationType)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textAlignment, NSTextAlignment)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI17_0_0RCTTextField)
{
  view.font = [ABI17_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI17_0_0RCTTextField)
{
  view.font = [ABI17_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI17_0_0RCTTextField)
{
  view.font = [ABI17_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI17_0_0RCTTextField)
{
  view.font = [ABI17_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI17_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI17_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI17_0_0Tag = shadowView.ReactABI17_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI17_0_0RCTTextField *> *viewRegistry) {
    viewRegistry[ReactABI17_0_0Tag].contentInset = padding;
  };
}

@end
