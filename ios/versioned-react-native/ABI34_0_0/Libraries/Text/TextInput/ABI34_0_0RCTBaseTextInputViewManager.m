/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTBaseTextInputViewManager.h"

#import <ReactABI34_0_0/ABI34_0_0RCTAccessibilityManager.h>
#import <ReactABI34_0_0/ABI34_0_0RCTBridge.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTFont.h>
#import <ReactABI34_0_0/ABI34_0_0RCTShadowView+Layout.h>
#import <ReactABI34_0_0/ABI34_0_0RCTShadowView.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManager.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManagerUtils.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI34_0_0RCTBaseTextInputShadowView.h"
#import "ABI34_0_0RCTBaseTextInputView.h"
#import "ABI34_0_0RCTConvert+Text.h"

@interface ABI34_0_0RCTBaseTextInputViewManager () <ABI34_0_0RCTUIManagerObserver>

@end

@implementation ABI34_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI34_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI34_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI34_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, backedTextInputView.scrollEnabled, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(secureTextEntry, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI34_0_0RCTTextSelection)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(textContentType, NSString)

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI34_0_0RCTBubblingEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI34_0_0RCTDirectEventBlock)

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI34_0_0RCTBubblingEventBlock)


- (ABI34_0_0RCTShadowView *)shadowView
{
  ABI34_0_0RCTBaseTextInputShadowView *shadowView = [[ABI34_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI34_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI34_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - ABI34_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI34_0_0RCTUIManager *)uiManager
{
  for (ABI34_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI34_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI34_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI34_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
