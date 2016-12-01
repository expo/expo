/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTTextViewManager.h"

#import "ABI12_0_0RCTBridge.h"
#import "ABI12_0_0RCTConvert.h"
#import "ABI12_0_0RCTShadowView.h"
#import "ABI12_0_0RCTTextView.h"
#import "ABI12_0_0RCTFont.h"

@implementation ABI12_0_0RCTTextViewManager

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI12_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI12_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI12_0_0RCTBubblingEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI12_0_0RCTBubblingEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI12_0_0RCTTextSelection)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI12_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI12_0_0RCTTextView)
{
  view.font = [ABI12_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI12_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI12_0_0RCTTextView)
{
  view.font = [ABI12_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI12_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI12_0_0RCTTextView)
{
  view.font = [ABI12_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI12_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI12_0_0RCTTextView)
{
  view.font = [ABI12_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, textView.dataDetectorTypes, UIDataDetectorTypes)

- (ABI12_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI12_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI12_0_0Tag = shadowView.ReactABI12_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI12_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI12_0_0Tag].contentInset = padding;
  };
}

@end
