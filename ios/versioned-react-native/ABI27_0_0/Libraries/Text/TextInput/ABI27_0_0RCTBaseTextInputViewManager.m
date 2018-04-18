/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTBaseTextInputViewManager.h"

#import <ReactABI27_0_0/ABI27_0_0RCTAccessibilityManager.h>
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert.h>
#import <ReactABI27_0_0/ABI27_0_0RCTFont.h>
#import <ReactABI27_0_0/ABI27_0_0RCTShadowView+Layout.h>
#import <ReactABI27_0_0/ABI27_0_0RCTShadowView.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManagerUtils.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI27_0_0RCTBaseTextInputShadowView.h"
#import "ABI27_0_0RCTBaseTextInputView.h"
#import "ABI27_0_0RCTConvert+Text.h"

@interface ABI27_0_0RCTBaseTextInputViewManager () <ABI27_0_0RCTUIManagerObserver>

@end

@implementation ABI27_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI27_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI27_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI27_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(keyboardType, backedTextInputView.keyboardType, UIKeyboardType)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI27_0_0RCTTextSelection)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI27_0_0RCTDirectEventBlock)

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI27_0_0RCTBubblingEventBlock)


- (ABI27_0_0RCTShadowView *)shadowView
{
  ABI27_0_0RCTBaseTextInputShadowView *shadowView = [[ABI27_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI27_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI27_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - ABI27_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI27_0_0RCTUIManager *)uiManager
{
  for (ABI27_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI27_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI27_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI27_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
