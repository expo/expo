/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTBaseTextInputViewManager.h>

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTFont.h>
#import <ABI43_0_0React/ABI43_0_0RCTShadowView+Layout.h>
#import <ABI43_0_0React/ABI43_0_0RCTShadowView.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManagerUtils.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManagerObserverCoordinator.h>

#import <ABI43_0_0React/ABI43_0_0RCTBaseTextInputShadowView.h>
#import <ABI43_0_0React/ABI43_0_0RCTBaseTextInputView.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert+Text.h>

@interface ABI43_0_0RCTBaseTextInputViewManager () <ABI43_0_0RCTUIManagerObserver>

@end

@implementation ABI43_0_0RCTBaseTextInputViewManager
{
  NSHashTable<ABI43_0_0RCTBaseTextInputShadowView *> *_shadowViews;
}

ABI43_0_0RCT_EXPORT_MODULE()

#pragma mark - Unified <TextInput> properties

ABI43_0_0RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, backedTextInputView.scrollEnabled, BOOL)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(secureTextEntry, backedTextInputView.secureTextEntry, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(autoFocus, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(showSoftInputOnFocus, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(selection, ABI43_0_0RCTTextSelection)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(textContentType, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(passwordRules, NSString)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI43_0_0RCTBubblingEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI43_0_0RCTDirectEventBlock)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, ABI43_0_0RCTBubblingEventBlock)

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(multiline, BOOL, UIView)
{
  // No op.
  // This View Manager doesn't use this prop but it must be exposed here via ViewConfig to enable Fabric component use it.
}

- (ABI43_0_0RCTShadowView *)shadowView
{
  ABI43_0_0RCTBaseTextInputShadowView *shadowView = [[ABI43_0_0RCTBaseTextInputShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = [[[self.bridge
                                                    moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES] valueForKey:@"multiplier"] floatValue];
  [_shadowViews addObject:shadowView];
  return shadowView;
}

- (void)setBridge:(ABI43_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:@"ABI43_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification"
                                             object:[bridge moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES]];
}

ABI43_0_0RCT_EXPORT_METHOD(focus : (nonnull NSNumber *)viewTag)
{
  [self.bridge.uiManager addUIBlock:^(ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    [view ABI43_0_0ReactFocus];
  }];
}

ABI43_0_0RCT_EXPORT_METHOD(blur : (nonnull NSNumber *)viewTag)
{
  [self.bridge.uiManager addUIBlock:^(ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    [view ABI43_0_0ReactBlur];
  }];
}

ABI43_0_0RCT_EXPORT_METHOD(setTextAndSelection : (nonnull NSNumber *)viewTag
                 mostRecentEventCount : (NSInteger)mostRecentEventCount
                                value : (NSString *)value
                                start : (NSInteger)start
                                  end : (NSInteger)end)
{
  [self.bridge.uiManager addUIBlock:^(ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI43_0_0RCTBaseTextInputView *view = (ABI43_0_0RCTBaseTextInputView *)viewRegistry[viewTag];
    NSInteger eventLag = view.nativeEventCount - mostRecentEventCount;
    if (eventLag != 0) {
      return;
    }
    ABI43_0_0RCTExecuteOnUIManagerQueue(^{
      ABI43_0_0RCTBaseTextInputShadowView *shadowView = (ABI43_0_0RCTBaseTextInputShadowView *)[self.bridge.uiManager shadowViewForABI43_0_0ReactTag:viewTag];
      [shadowView setText:value];
      [self.bridge.uiManager setNeedsLayout];
      ABI43_0_0RCTExecuteOnMainQueue(^{
        [view setSelectionStart:start selectionEnd:end];
      });
    });
  }];
}

#pragma mark - ABI43_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI43_0_0RCTUIManager *)uiManager
{
  for (ABI43_0_0RCTBaseTextInputShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = [[[self.bridge moduleForName:@"AccessibilityManager"]
                                 valueForKey:@"multiplier"] floatValue];

  NSHashTable<ABI43_0_0RCTBaseTextInputShadowView *> *shadowViews = _shadowViews;
  ABI43_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI43_0_0RCTBaseTextInputShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
