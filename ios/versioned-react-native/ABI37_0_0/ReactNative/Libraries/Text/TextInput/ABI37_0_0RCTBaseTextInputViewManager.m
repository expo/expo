/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTBaseTextInputViewManager.h>

#import <ABI37_0_0React/ABI37_0_0RCTAccessibilityManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTFont.h>
#import <ABI37_0_0React/ABI37_0_0RCTShadowView+Layout.h>
#import <ABI37_0_0React/ABI37_0_0RCTShadowView.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerUtils.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerObserverCoordinator.h>

#import <ABI37_0_0React/ABI37_0_0RCTBaseTextInputShadowView.h>
#import <ABI37_0_0React/ABI37_0_0RCTBaseTextInputView.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert+Text.h>

@interface ABI37_0_0RCTBaseTextInputViewManager () <ABI37_0_0RCTUIManagerObserver>

@end

@implementation ABI37_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI37_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI37_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI37_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, backedTextInputView.scrollEnabled, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(secureTextEntry, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI37_0_0RCTTextSelection)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(textContentType, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(passwordRules, NSString)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI37_0_0RCTBubblingEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI37_0_0RCTDirectEventBlock)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI37_0_0RCTBubblingEventBlock)


- (ABI37_0_0RCTShadowView *)shadowView
{
  ABI37_0_0RCTBaseTextInputShadowView *shadowView = [[ABI37_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI37_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI37_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - ABI37_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI37_0_0RCTUIManager *)uiManager
{
  for (ABI37_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI37_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI37_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI37_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
