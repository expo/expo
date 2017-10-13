/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTTextViewManager.h"

#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTFont.h>
#import <ReactABI22_0_0/ABI22_0_0RCTShadowView+Layout.h>
#import <ReactABI22_0_0/ABI22_0_0RCTShadowView.h>

#import "ABI22_0_0RCTConvert+Text.h"
#import "ABI22_0_0RCTShadowTextView.h"
#import "ABI22_0_0RCTTextView.h"

@implementation ABI22_0_0RCTTextViewManager

ABI22_0_0RCT_EXPORT_MODULE()

- (ABI22_0_0RCTShadowView *)shadowView
{
  return [ABI22_0_0RCTShadowTextView new];
}

- (UIView *)view
{
  return [[ABI22_0_0RCTTextView alloc] initWithBridge:self.bridge];
}

#pragma mark - Unified <TextInput> properties

ABI22_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(color, backedTextInputView.textColor, UIColor)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, backedTextInputView.keyboardType, UIKeyboardType)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, backedTextInputView.textAlignment, NSTextAlignment)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI22_0_0RCTTextSelection)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI22_0_0RCTDirectEventBlock)

ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI22_0_0RCTTextView)
{
  view.font = [ABI22_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI22_0_0RCTTextView)
{
  view.font = [ABI22_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI22_0_0RCTTextView)
{
  view.font = [ABI22_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI22_0_0RCTTextView)
{
  view.font = [ABI22_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

#if !TARGET_OS_TV
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes)
#endif

- (ABI22_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI22_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI22_0_0Tag = shadowView.ReactABI22_0_0Tag;
  UIEdgeInsets borderAsInsets = shadowView.borderAsInsets;
  UIEdgeInsets paddingAsInsets = shadowView.paddingAsInsets;
  return ^(ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI22_0_0RCTTextInput *> *viewRegistry) {
    ABI22_0_0RCTTextInput *view = viewRegistry[ReactABI22_0_0Tag];
    view.ReactABI22_0_0BorderInsets = borderAsInsets;
    view.ReactABI22_0_0PaddingInsets = paddingAsInsets;
  };
}

@end
