/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTBaseTextInputViewManager.h>

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTFont.h>
#import <ABI47_0_0React/ABI47_0_0RCTShadowView+Layout.h>
#import <ABI47_0_0React/ABI47_0_0RCTShadowView.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManagerUtils.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManagerObserverCoordinator.h>

#import <ABI47_0_0React/ABI47_0_0RCTBaseTextInputShadowView.h>
#import <ABI47_0_0React/ABI47_0_0RCTBaseTextInputView.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert+Text.h>

@interface ABI47_0_0RCTBaseTextInputViewManager () <ABI47_0_0RCTUIManagerObserver>

@end

@implementation ABI47_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI47_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI47_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI47_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, backedTextInputView.scrollEnabled, BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(autoFocus, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(showSoftInputOnFocus, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI47_0_0RCTTextSelection)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(textContentType, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(passwordRules, NSString)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onKeyPressSync, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onChangeSync, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI47_0_0RCTDirectEventBlock)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI47_0_0RCTBubblingEventBlock)

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(multiline, BOOL, UIView)
{
  // No op.
  // This View Manager doesn't use this prop but it must be exposed here via ViewConfig to enable Fabric component use it.
}

- (ABI47_0_0RCTShadowView *)shadowView
{
  ABI47_0_0RCTBaseTextInputShadowView *shadowView = [[ABI47_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = [[[self.bridge
                                                    moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES] valueForKey:@"multiplier"] floatValue];
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI47_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:@"ABI47_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification"
                                             object:[bridge moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES]];
}

ABI47_0_0RCT_EXPORT_METHOD(focus : (nonnull NSNumber *)viewTag)
{
  [self.bridge.uiManager addUIBlock:^(ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    [view ABI47_0_0ReactFocus];
  }];
}

ABI47_0_0RCT_EXPORT_METHOD(blur : (nonnull NSNumber *)viewTag)
{
  [self.bridge.uiManager addUIBlock:^(ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    [view ABI47_0_0ReactBlur];
  }];
}

ABI47_0_0RCT_EXPORT_METHOD(setTextAndSelection : (nonnull NSNumber *)viewTag
                 mostRecentEventCount : (NSInteger)mostRecentEventCount
                                value : (NSString *)value
                                start : (NSInteger)start
                                  end : (NSInteger)end)
{
  [self.bridge.uiManager addUIBlock:^(ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI47_0_0RCTBaseTextInputView *view = (ABI47_0_0RCTBaseTextInputView *)viewRegistry[viewTag];
    NSInteger eventLag = view.nativeEventCount - mostRecentEventCount;
    if (eventLag != 0) {
      return;
    }
    ABI47_0_0RCTExecuteOnUIManagerQueue(^{
      ABI47_0_0RCTBaseTextInputShadowView *shadowView = (ABI47_0_0RCTBaseTextInputShadowView *)[self.bridge.uiManager shadowViewForABI47_0_0ReactTag:viewTag];
      if (value) {
        [shadowView setText:value];
      }
      [self.bridge.uiManager setNeedsLayout];
      ABI47_0_0RCTExecuteOnMainQueue(^{
        [view setSelectionStart:start selectionEnd:end];
      });
    });
  }];
}

#pragma mark - ABI47_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI47_0_0RCTUIManager *)uiManager
{
  for (ABI47_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = [[[self.bridge moduleForName:@"AccessibilityManager"]
                                 valueForKey:@"multiplier"] floatValue];

  NSHashTable<ABI47_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI47_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI47_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
