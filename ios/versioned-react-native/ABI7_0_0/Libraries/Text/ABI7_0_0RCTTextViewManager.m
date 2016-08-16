/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTTextViewManager.h"

#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTShadowView.h"
#import "ABI7_0_0RCTTextView.h"

@implementation ABI7_0_0RCTTextViewManager

ABI7_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI7_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI7_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI7_0_0RCTTextView)
{
  view.font = [ABI7_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, ABI7_0_0RCTTextView)
{
  view.font = [ABI7_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, ABI7_0_0RCTTextView)
{
  view.font = [ABI7_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI7_0_0RCTTextView)
{
  view.font = [ABI7_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (ABI7_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI7_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI7_0_0Tag = shadowView.ReactABI7_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI7_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI7_0_0Tag].contentInset = padding;
  };
}

@end
