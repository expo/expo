/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTTextViewManager.h"

#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTFont.h>
#import <ReactABI16_0_0/ABI16_0_0RCTShadowView.h>

#import "ABI16_0_0RCTConvert+Text.h"
#import "ABI16_0_0RCTTextView.h"

@implementation ABI16_0_0RCTTextViewManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI16_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI16_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, autocorrectionType, UITextAutocorrectionType)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, spellCheckingType, UITextSpellCheckingType)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI16_0_0RCTBubblingEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI16_0_0RCTBubblingEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI16_0_0RCTTextSelection)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI16_0_0RCTTextView)
{
  view.font = [ABI16_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI16_0_0RCTTextView)
{
  view.font = [ABI16_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI16_0_0RCTTextView)
{
  view.font = [ABI16_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI16_0_0RCTTextView)
{
  view.font = [ABI16_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

#if !TARGET_OS_TV
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, textView.dataDetectorTypes, UIDataDetectorTypes)
#endif

- (ABI16_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI16_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI16_0_0Tag = shadowView.ReactABI16_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI16_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI16_0_0Tag].contentInset = padding;
  };
}

@end
