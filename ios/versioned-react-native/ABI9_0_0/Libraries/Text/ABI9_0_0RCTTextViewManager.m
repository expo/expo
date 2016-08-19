/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTTextViewManager.h"

#import "ABI9_0_0RCTBridge.h"
#import "ABI9_0_0RCTConvert.h"
#import "ABI9_0_0RCTShadowView.h"
#import "ABI9_0_0RCTTextView.h"

@implementation ABI9_0_0RCTTextViewManager

ABI9_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI9_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI9_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI9_0_0RCTBubblingEventBlock)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI9_0_0RCTBubblingEventBlock)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI9_0_0RCTDirectEventBlock)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI9_0_0RCTDirectEventBlock)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI9_0_0RCTTextView)
{
  view.font = [ABI9_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, ABI9_0_0RCTTextView)
{
  view.font = [ABI9_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, ABI9_0_0RCTTextView)
{
  view.font = [ABI9_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI9_0_0RCTTextView)
{
  view.font = [ABI9_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI9_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI9_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI9_0_0Tag = shadowView.ReactABI9_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI9_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI9_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI9_0_0Tag].contentInset = padding;
  };
}

@end
