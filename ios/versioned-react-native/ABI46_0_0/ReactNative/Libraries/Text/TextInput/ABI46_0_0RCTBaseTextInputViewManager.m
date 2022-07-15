/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTBaseTextInputViewManager.h>

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>
#import <ABI46_0_0React/ABI46_0_0RCTFont.h>
#import <ABI46_0_0React/ABI46_0_0RCTShadowView+Layout.h>
#import <ABI46_0_0React/ABI46_0_0RCTShadowView.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManagerUtils.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManagerObserverCoordinator.h>

#import <ABI46_0_0React/ABI46_0_0RCTBaseTextInputShadowView.h>
#import <ABI46_0_0React/ABI46_0_0RCTBaseTextInputView.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert+Text.h>

@interface ABI46_0_0RCTBaseTextInputViewManager () <ABI46_0_0RCTUIManagerObserver>

@end

@implementation ABI46_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI46_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI46_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI46_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, backedTextInputView.scrollEnabled, BOOL)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(autoFocus, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(showSoftInputOnFocus, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI46_0_0RCTTextSelection)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(textContentType, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(passwordRules, NSString)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onKeyPressSync, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onChangeSync, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI46_0_0RCTDirectEventBlock)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI46_0_0RCTBubblingEventBlock)

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(multiline, BOOL, UIView)
{
  // No op.
  // This View Manager doesn't use this prop but it must be exposed here via ViewConfig to enable Fabric component use it.
}

- (ABI46_0_0RCTShadowView *)shadowView
{
  ABI46_0_0RCTBaseTextInputShadowView *shadowView = [[ABI46_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = [[[self.bridge
                                                    moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES] valueForKey:@"multiplier"] floatValue];
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI46_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:@"ABI46_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification"
                                             object:[bridge moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES]];
}

ABI46_0_0RCT_EXPORT_METHOD(focus : (nonnull NSNumber *)viewTag)
{
  [self.bridge.uiManager addUIBlock:^(ABI46_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    [view ABI46_0_0ReactFocus];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(blur : (nonnull NSNumber *)viewTag)
{
  [self.bridge.uiManager addUIBlock:^(ABI46_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    [view ABI46_0_0ReactBlur];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(setTextAndSelection : (nonnull NSNumber *)viewTag
                 mostRecentEventCount : (NSInteger)mostRecentEventCount
                                value : (NSString *)value
                                start : (NSInteger)start
                                  end : (NSInteger)end)
{
  [self.bridge.uiManager addUIBlock:^(ABI46_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI46_0_0RCTBaseTextInputView *view = (ABI46_0_0RCTBaseTextInputView *)viewRegistry[viewTag];
    NSInteger eventLag = view.nativeEventCount - mostRecentEventCount;
    if (eventLag != 0) {
      return;
    }
    ABI46_0_0RCTExecuteOnUIManagerQueue(^{
      ABI46_0_0RCTBaseTextInputShadowView *shadowView = (ABI46_0_0RCTBaseTextInputShadowView *)[self.bridge.uiManager shadowViewForABI46_0_0ReactTag:viewTag];
      if (value) {
        [shadowView setText:value];
      }
      [self.bridge.uiManager setNeedsLayout];
      ABI46_0_0RCTExecuteOnMainQueue(^{
        [view setSelectionStart:start selectionEnd:end];
      });
    });
  }];
}

#pragma mark - ABI46_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI46_0_0RCTUIManager *)uiManager
{
  for (ABI46_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = [[[self.bridge moduleForName:@"AccessibilityManager"]
                                 valueForKey:@"multiplier"] floatValue];

  NSHashTable<ABI46_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI46_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI46_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
