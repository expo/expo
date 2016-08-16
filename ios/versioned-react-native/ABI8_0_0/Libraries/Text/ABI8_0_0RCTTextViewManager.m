/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTTextViewManager.h"

#import "ABI8_0_0RCTBridge.h"
#import "ABI8_0_0RCTConvert.h"
#import "ABI8_0_0RCTShadowView.h"
#import "ABI8_0_0RCTTextView.h"

@implementation ABI8_0_0RCTTextViewManager

ABI8_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI8_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI8_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI8_0_0RCTBubblingEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI8_0_0RCTBubblingEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI8_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI8_0_0RCTTextView)
{
  view.font = [ABI8_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI8_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, ABI8_0_0RCTTextView)
{
  view.font = [ABI8_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI8_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, ABI8_0_0RCTTextView)
{
  view.font = [ABI8_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI8_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI8_0_0RCTTextView)
{
  view.font = [ABI8_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI8_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI8_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI8_0_0Tag = shadowView.ReactABI8_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI8_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI8_0_0Tag].contentInset = padding;
  };
}

@end
