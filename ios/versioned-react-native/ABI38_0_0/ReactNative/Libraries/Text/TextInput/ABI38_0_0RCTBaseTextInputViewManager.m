/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTBaseTextInputViewManager.h>

#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import <ABI38_0_0React/ABI38_0_0RCTFont.h>
#import <ABI38_0_0React/ABI38_0_0RCTShadowView+Layout.h>
#import <ABI38_0_0React/ABI38_0_0RCTShadowView.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManagerUtils.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManagerObserverCoordinator.h>

#import <ABI38_0_0React/ABI38_0_0RCTBaseTextInputShadowView.h>
#import <ABI38_0_0React/ABI38_0_0RCTBaseTextInputView.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert+Text.h>

@interface ABI38_0_0RCTBaseTextInputViewManager () <ABI38_0_0RCTUIManagerObserver>

@end

@implementation ABI38_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI38_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI38_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI38_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, backedTextInputView.scrollEnabled, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(autoFocus, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI38_0_0RCTTextSelection)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(textContentType, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(passwordRules, NSString)

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI38_0_0RCTBubblingEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI38_0_0RCTDirectEventBlock)

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI38_0_0RCTBubblingEventBlock)


- (ABI38_0_0RCTShadowView *)shadowView
{
  ABI38_0_0RCTBaseTextInputShadowView *shadowView = [[ABI38_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = [[[self.bridge
                                                    moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES] valueForKey:@"multiplier"] floatValue];
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI38_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:@"ABI38_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification"
                                             object:[bridge moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES]];
}

#pragma mark - ABI38_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI38_0_0RCTUIManager *)uiManager
{
  for (ABI38_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = [[[self.bridge moduleForName:@"AccessibilityManager"]
                                 valueForKey:@"multiplier"] floatValue];

  NSHashTable<ABI38_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI38_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI38_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
