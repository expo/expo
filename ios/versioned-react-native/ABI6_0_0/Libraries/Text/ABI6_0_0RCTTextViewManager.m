/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTTextViewManager.h"

#import "ABI6_0_0RCTBridge.h"
#import "ABI6_0_0RCTConvert.h"
#import "ABI6_0_0RCTShadowView.h"
#import "ABI6_0_0RCTTextView.h"

@implementation ABI6_0_0RCTTextViewManager

ABI6_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI6_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI6_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI6_0_0RCTDirectEventBlock)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI6_0_0RCTTextView)
{
  view.font = [ABI6_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, ABI6_0_0RCTTextView)
{
  view.font = [ABI6_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, ABI6_0_0RCTTextView)
{
  view.font = [ABI6_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI6_0_0RCTTextView)
{
  view.font = [ABI6_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI6_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI6_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI6_0_0Tag = shadowView.ReactABI6_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI6_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI6_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI6_0_0Tag].contentInset = padding;
  };
}

@end
