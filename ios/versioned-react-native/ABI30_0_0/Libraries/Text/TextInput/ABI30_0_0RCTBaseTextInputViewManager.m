/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTBaseTextInputViewManager.h"

#import <ReactABI30_0_0/ABI30_0_0RCTAccessibilityManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import <ReactABI30_0_0/ABI30_0_0RCTFont.h>
#import <ReactABI30_0_0/ABI30_0_0RCTShadowView+Layout.h>
#import <ReactABI30_0_0/ABI30_0_0RCTShadowView.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerUtils.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI30_0_0RCTBaseTextInputShadowView.h"
#import "ABI30_0_0RCTBaseTextInputView.h"
#import "ABI30_0_0RCTConvert+Text.h"

@interface ABI30_0_0RCTBaseTextInputViewManager () <ABI30_0_0RCTUIManagerObserver>

@end

@implementation ABI30_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI30_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI30_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI30_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI30_0_0RCTTextSelection)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(textContentType, NSString)

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI30_0_0RCTBubblingEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI30_0_0RCTDirectEventBlock)

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI30_0_0RCTBubblingEventBlock)


- (ABI30_0_0RCTShadowView *)shadowView
{
  ABI30_0_0RCTBaseTextInputShadowView *shadowView = [[ABI30_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI30_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI30_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - ABI30_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI30_0_0RCTUIManager *)uiManager
{
  for (ABI30_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI30_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI30_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI30_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
