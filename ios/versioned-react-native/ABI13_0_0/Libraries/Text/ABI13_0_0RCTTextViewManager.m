/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTTextViewManager.h"

#import <ReactABI13_0_0/ABI13_0_0RCTBridge.h>
#import <ReactABI13_0_0/ABI13_0_0RCTConvert.h>
#import <ReactABI13_0_0/ABI13_0_0RCTFont.h>
#import <ReactABI13_0_0/ABI13_0_0RCTShadowView.h>

#import "ABI13_0_0RCTTextView.h"
#import "ABI13_0_0RCTConvert+Text.h"

@implementation ABI13_0_0RCTTextViewManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI13_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI13_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, autocorrectionType, UITextAutocorrectionType)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, spellCheckingType, UITextSpellCheckingType)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI13_0_0RCTBubblingEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI13_0_0RCTBubblingEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI13_0_0RCTTextSelection)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI13_0_0RCTTextView)
{
  view.font = [ABI13_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI13_0_0RCTTextView)
{
  view.font = [ABI13_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI13_0_0RCTTextView)
{
  view.font = [ABI13_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI13_0_0RCTTextView)
{
  view.font = [ABI13_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, textView.dataDetectorTypes, UIDataDetectorTypes)

- (ABI13_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI13_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI13_0_0Tag = shadowView.ReactABI13_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI13_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI13_0_0Tag].contentInset = padding;
  };
}

@end
