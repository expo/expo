/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTTextViewManager.h"

#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTFont.h>
#import <ReactABI14_0_0/ABI14_0_0RCTShadowView.h>

#import "ABI14_0_0RCTConvert+Text.h"
#import "ABI14_0_0RCTTextView.h"

@implementation ABI14_0_0RCTTextViewManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI14_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI14_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, autocorrectionType, UITextAutocorrectionType)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, spellCheckingType, UITextSpellCheckingType)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI14_0_0RCTBubblingEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI14_0_0RCTBubblingEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI14_0_0RCTTextSelection)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI14_0_0RCTTextView)
{
  view.font = [ABI14_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI14_0_0RCTTextView)
{
  view.font = [ABI14_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI14_0_0RCTTextView)
{
  view.font = [ABI14_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI14_0_0RCTTextView)
{
  view.font = [ABI14_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

#if !TARGET_OS_TV
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, textView.dataDetectorTypes, UIDataDetectorTypes)
#endif

- (ABI14_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI14_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI14_0_0Tag = shadowView.ReactABI14_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI14_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI14_0_0Tag].contentInset = padding;
  };
}

@end
