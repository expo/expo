/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTBaseTextInputViewManager.h"

#import <ReactABI33_0_0/ABI33_0_0RCTAccessibilityManager.h>
#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>
#import <ReactABI33_0_0/ABI33_0_0RCTFont.h>
#import <ReactABI33_0_0/ABI33_0_0RCTShadowView+Layout.h>
#import <ReactABI33_0_0/ABI33_0_0RCTShadowView.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManagerUtils.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI33_0_0RCTBaseTextInputShadowView.h"
#import "ABI33_0_0RCTBaseTextInputView.h"
#import "ABI33_0_0RCTConvert+Text.h"

@interface ABI33_0_0RCTBaseTextInputViewManager () <ABI33_0_0RCTUIManagerObserver>

@end

@implementation ABI33_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI33_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI33_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI33_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, backedTextInputView.scrollEnabled, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(secureTextEntry, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI33_0_0RCTTextSelection)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(textContentType, NSString)

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI33_0_0RCTDirectEventBlock)

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI33_0_0RCTBubblingEventBlock)


- (ABI33_0_0RCTShadowView *)shadowView
{
  ABI33_0_0RCTBaseTextInputShadowView *shadowView = [[ABI33_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI33_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI33_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - ABI33_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI33_0_0RCTUIManager *)uiManager
{
  for (ABI33_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI33_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI33_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI33_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
