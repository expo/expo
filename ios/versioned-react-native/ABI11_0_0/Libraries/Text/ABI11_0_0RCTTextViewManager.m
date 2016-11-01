/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTTextViewManager.h"

#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTConvert.h"
#import "ABI11_0_0RCTShadowView.h"
#import "ABI11_0_0RCTTextView.h"
#import "ABI11_0_0RCTFont.h"

@implementation ABI11_0_0RCTTextViewManager

ABI11_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI11_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI11_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI11_0_0RCTBubblingEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI11_0_0RCTBubblingEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI11_0_0RCTDirectEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI11_0_0RCTDirectEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI11_0_0RCTTextSelection)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI11_0_0RCTTextView)
{
  view.font = [ABI11_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI11_0_0RCTTextView)
{
  view.font = [ABI11_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI11_0_0RCTTextView)
{
  view.font = [ABI11_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI11_0_0RCTTextView)
{
  view.font = [ABI11_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, textView.dataDetectorTypes, UIDataDetectorTypes)

- (ABI11_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI11_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI11_0_0Tag = shadowView.ReactABI11_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI11_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI11_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI11_0_0Tag].contentInset = padding;
  };
}

@end
