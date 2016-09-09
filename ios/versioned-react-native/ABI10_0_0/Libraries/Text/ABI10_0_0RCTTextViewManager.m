/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTTextViewManager.h"

#import "ABI10_0_0RCTBridge.h"
#import "ABI10_0_0RCTConvert.h"
#import "ABI10_0_0RCTShadowView.h"
#import "ABI10_0_0RCTTextView.h"
#import "ABI10_0_0RCTFont.h"

@implementation ABI10_0_0RCTTextViewManager

ABI10_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI10_0_0RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI10_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI10_0_0RCTBubblingEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI10_0_0RCTBubblingEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI10_0_0RCTDirectEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI10_0_0RCTDirectEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI10_0_0RCTTextSelection)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI10_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI10_0_0RCTTextView)
{
  view.font = [ABI10_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI10_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI10_0_0RCTTextView)
{
  view.font = [ABI10_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI10_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI10_0_0RCTTextView)
{
  view.font = [ABI10_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI10_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI10_0_0RCTTextView)
{
  view.font = [ABI10_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, textView.dataDetectorTypes, UIDataDetectorTypes)

- (ABI10_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI10_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI10_0_0Tag = shadowView.ReactABI10_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(ABI10_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI10_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI10_0_0Tag].contentInset = padding;
  };
}

@end
