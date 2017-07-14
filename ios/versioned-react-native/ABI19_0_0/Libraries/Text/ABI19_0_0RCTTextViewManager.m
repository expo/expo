/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTTextViewManager.h"

#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTFont.h>
#import <ReactABI19_0_0/ABI19_0_0RCTShadowView+Layout.h>
#import <ReactABI19_0_0/ABI19_0_0RCTShadowView.h>

#import "ABI19_0_0RCTConvert+Text.h"
#import "ABI19_0_0RCTShadowTextView.h"
#import "ABI19_0_0RCTTextView.h"

@implementation ABI19_0_0RCTTextViewManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0RCTShadowView *)shadowView
{
  return [ABI19_0_0RCTShadowTextView new];
}

- (UIView *)view
{
  return [[ABI19_0_0RCTTextView alloc] initWithBridge:self.bridge];
}

ABI19_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, autocorrectionType, UITextAutocorrectionType)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, spellCheckingType, UITextSpellCheckingType)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(color, textView.textColor, UIColor)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(textAlign, textView.textAlignment, NSTextAlignment)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textView.keyboardAppearance, UIKeyboardAppearance)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI19_0_0RCTBubblingEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI19_0_0RCTBubblingEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textView.secureTextEntry, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, tintColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI19_0_0RCTTextSelection)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(text, NSString)
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI19_0_0RCTTextView)
{
  view.font = [ABI19_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI19_0_0RCTTextView)
{
  view.font = [ABI19_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI19_0_0RCTTextView)
{
  view.font = [ABI19_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI19_0_0RCTTextView)
{
  view.font = [ABI19_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

#if !TARGET_OS_TV
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, textView.dataDetectorTypes, UIDataDetectorTypes)
#endif

- (ABI19_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI19_0_0RCTShadowView *)shadowView
{
  NSNumber *ReactABI19_0_0Tag = shadowView.ReactABI19_0_0Tag;
  UIEdgeInsets borderAsInsets = shadowView.borderAsInsets;
  UIEdgeInsets paddingAsInsets = shadowView.paddingAsInsets;
  return ^(ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI19_0_0RCTTextView *> *viewRegistry) {
    viewRegistry[ReactABI19_0_0Tag].ReactABI19_0_0BorderInsets = borderAsInsets;
    viewRegistry[ReactABI19_0_0Tag].ReactABI19_0_0PaddingInsets = paddingAsInsets;
  };
}

@end
