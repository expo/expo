/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTTextViewManager.h"

#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>
#import <ReactABI18_0_0/ABI18_0_0RCTConvert.h>
#import <ReactABI18_0_0/ABI18_0_0RCTFont.h>
#import <ReactABI18_0_0/ABI18_0_0RCTShadowView+Layout.h>
#import <ReactABI18_0_0/ABI18_0_0RCTShadowView.h>

#import "ABI18_0_0RCTConvert+Text.h"
#import "ABI18_0_0RCTShadowTextView.h"
#import "ABI18_0_0RCTTextView.h"

@implementation ABI18_0_0RCTTextViewManager

ABI18_0_0RCT_EXPORT_MODULE()

- (ABI18_0_0RCTShadowView *)shadowView
{
  return [ABI18_0_0RCTShadowTextView new];
}

- (UIView *)view
{
  return [[ABI18_0_0RCTTextView alloc] initWithBridge:self.bridge];
}

ABI18_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, autocorrectionType, UITextAutocorrectionType)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, spellCheckingType, UITextSpellCheckingType)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI18_0_0RCTBubblingEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI18_0_0RCTBubblingEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI18_0_0RCTTextSelection)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI18_0_0RCTTextView)
{
  view.font = [ABI18_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI18_0_0RCTTextView)
{
  view.font = [ABI18_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI18_0_0RCTTextView)
{
  view.font = [ABI18_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI18_0_0RCTTextView)
{
  view.font = [ABI18_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

#if !TARGET_OS_TV
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, textView.dataDetectorTypes, UIDataDetectorTypes)
#endif

- (ABI18_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI18_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI18_0_0Tag = shadowView.ReactABI18_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI18_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI18_0_0Tag].contentInset = padding;
  };
}

@end
