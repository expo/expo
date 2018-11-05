/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTBaseTextInputViewManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTAccessibilityManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTFont.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView+Layout.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI26_0_0RCTBaseTextInputShadowView.h"
#import "ABI26_0_0RCTBaseTextInputView.h"
#import "ABI26_0_0RCTConvert+Text.h"

@interface ABI26_0_0RCTBaseTextInputViewManager () <ABI26_0_0RCTUIManagerObserver>

@end

@implementation ABI26_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI26_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI26_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI26_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, backedTextInputView.keyboardType, UIKeyboardType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI26_0_0RCTTextSelection)

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI26_0_0RCTDirectEventBlock)

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI26_0_0RCTBubblingEventBlock)


- (ABI26_0_0RCTShadowView *)shadowView
{
  ABI26_0_0RCTBaseTextInputShadowView *shadowView = [[ABI26_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI26_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI26_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - ABI26_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI26_0_0RCTUIManager *)uiManager
{
  for (ABI26_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  for (ABI26_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
    [shadowView dirtyLayout];
  }

  [self.bridge.uiManager setNeedsLayout];
}

@end
