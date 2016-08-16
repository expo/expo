/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTTextViewManager.h"

#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTConvert.h"
#import "ABI5_0_0RCTShadowView.h"
#import "ABI5_0_0RCTTextView.h"

@implementation ABI5_0_0RCTTextViewManager

ABI5_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI5_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI5_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI5_0_0RCTDirectEventBlock)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI5_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI5_0_0RCTTextView)
{
  view.font = [ABI5_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI5_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, ABI5_0_0RCTTextView)
{
  view.font = [ABI5_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI5_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, ABI5_0_0RCTTextView)
{
  view.font = [ABI5_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI5_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI5_0_0RCTTextView)
{
  view.font = [ABI5_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI5_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI5_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI5_0_0Tag = shadowView.ReactABI5_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI5_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI5_0_0Tag].contentInset = padding;
  };
}

@end
