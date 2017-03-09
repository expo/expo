/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTTextViewManager.h"

#import <ReactABI15_0_0/ABI15_0_0RCTBridge.h>
#import <ReactABI15_0_0/ABI15_0_0RCTConvert.h>
#import <ReactABI15_0_0/ABI15_0_0RCTFont.h>
#import <ReactABI15_0_0/ABI15_0_0RCTShadowView.h>

#import "ABI15_0_0RCTConvert+Text.h"
#import "ABI15_0_0RCTTextView.h"

@implementation ABI15_0_0RCTTextViewManager

ABI15_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI15_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI15_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, autocorrectionType, UITextAutocorrectionType)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, spellCheckingType, UITextSpellCheckingType)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI15_0_0RCTBubblingEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI15_0_0RCTBubblingEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI15_0_0RCTDirectEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI15_0_0RCTDirectEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI15_0_0RCTDirectEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI15_0_0RCTTextSelection)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI15_0_0RCTTextView)
{
  view.font = [ABI15_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI15_0_0RCTTextView)
{
  view.font = [ABI15_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI15_0_0RCTTextView)
{
  view.font = [ABI15_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI15_0_0RCTTextView)
{
  view.font = [ABI15_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

#if !TARGET_OS_TV
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, textView.dataDetectorTypes, UIDataDetectorTypes)
#endif

- (ABI15_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI15_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI15_0_0Tag = shadowView.ReactABI15_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI15_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI15_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI15_0_0Tag].contentInset = padding;
  };
}

@end
