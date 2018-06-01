/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTBaseTextInputViewManager.h"

#import <ReactABI28_0_0/ABI28_0_0RCTAccessibilityManager.h>
#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTFont.h>
#import <ReactABI28_0_0/ABI28_0_0RCTShadowView+Layout.h>
#import <ReactABI28_0_0/ABI28_0_0RCTShadowView.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManagerUtils.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI28_0_0RCTBaseTextInputShadowView.h"
#import "ABI28_0_0RCTBaseTextInputView.h"
#import "ABI28_0_0RCTConvert+Text.h"

@interface ABI28_0_0RCTBaseTextInputViewManager () <ABI28_0_0RCTUIManagerObserver>

@end

@implementation ABI28_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI28_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI28_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI28_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, backedTextInputView.keyboardType, UIKeyboardType)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI28_0_0RCTTextSelection)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI28_0_0RCTDirectEventBlock)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI28_0_0RCTBubblingEventBlock)


- (ABI28_0_0RCTShadowView *)shadowView
{
  ABI28_0_0RCTBaseTextInputShadowView *shadowView = [[ABI28_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI28_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI28_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - ABI28_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI28_0_0RCTUIManager *)uiManager
{
  for (ABI28_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI28_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI28_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI28_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
