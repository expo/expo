/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTTextViewManager.h"

#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTFont.h>
#import <ReactABI23_0_0/ABI23_0_0RCTShadowView+Layout.h>
#import <ReactABI23_0_0/ABI23_0_0RCTShadowView.h>

#import "ABI23_0_0RCTConvert+Text.h"
#import "ABI23_0_0RCTShadowTextView.h"
#import "ABI23_0_0RCTTextView.h"

@implementation ABI23_0_0RCTTextViewManager

ABI23_0_0RCT_EXPORT_MODULE()

- (ABI23_0_0RCTShadowView *)shadowView
{
  return [ABI23_0_0RCTShadowTextView new];
}

- (UIView *)view
{
  return [[ABI23_0_0RCTTextView alloc] initWithBridge:self.bridge];
}

#pragma mark - Unified <TextInput> properties

ABI23_0_0RCT_REMAP_VIEW_PROPERTY(allowFontScaling, fontAttributes.allowFontScaling, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(color, backedTextInputView.textColor, UIColor)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(fontSize, fontAttributes.fontSize, NSNumber)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(fontWeight, fontAttributes.fontWeight, NSString)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(fontStyle, fontAttributes.fontStyle, NSString)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(fontFamily, fontAttributes.fontFamily, NSString)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, backedTextInputView.keyboardType, UIKeyboardType)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, backedTextInputView.textAlignment, NSTextAlignment)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI23_0_0RCTTextSelection)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI23_0_0RCTDirectEventBlock)

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

#if !TARGET_OS_TV
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes)
#endif

- (ABI23_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI23_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI23_0_0Tag = shadowView.ReactABI23_0_0Tag;
  UIEdgeInsets borderAsInsets = shadowView.borderAsInsets;
  UIEdgeInsets paddingAsInsets = shadowView.paddingAsInsets;
  return ^(ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI23_0_0RCTTextInput *> *viewRegistry) {
    ABI23_0_0RCTTextInput *view = viewRegistry[ReactABI23_0_0Tag];
    view.ReactABI23_0_0BorderInsets = borderAsInsets;
    view.ReactABI23_0_0PaddingInsets = paddingAsInsets;
  };
}

@end
