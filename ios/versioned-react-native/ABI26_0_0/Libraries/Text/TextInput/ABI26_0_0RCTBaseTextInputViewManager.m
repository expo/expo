/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTBaseTextInputViewManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTFont.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView+Layout.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView.h>

#import "ABI26_0_0RCTConvert+Text.h"
#import "ABI26_0_0RCTBaseTextInputView.h"

@implementation ABI26_0_0RCTBaseTextInputViewManager

ABI26_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI26_0_0RCT_REMAP_VIEW_PROPERTY(allowFontScaling, fontAttributes.allowFontScaling, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(color, backedTextInputView.textColor, UIColor)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(fontSize, fontAttributes.fontSize, NSNumber)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(fontWeight, fontAttributes.fontWeight, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(fontStyle, fontAttributes.fontStyle, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(fontFamily, fontAttributes.fontFamily, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, backedTextInputView.keyboardType, UIKeyboardType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, backedTextInputView.textAlignment, NSTextAlignment)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI26_0_0RCTTextSelection)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI26_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI26_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI26_0_0Tag = shadowView.ReactABI26_0_0Tag;
  UIEdgeInsets borderAsInsets = shadowView.borderAsInsets;
  UIEdgeInsets paddingAsInsets = shadowView.paddingAsInsets;
  return ^(ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI26_0_0RCTBaseTextInputView *> *viewRegistry) {
    ABI26_0_0RCTBaseTextInputView *view = viewRegistry[ReactABI26_0_0Tag];
    view.ReactABI26_0_0BorderInsets = borderAsInsets;
    view.ReactABI26_0_0PaddingInsets = paddingAsInsets;
  };
}

@end
