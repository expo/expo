/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTTextViewManager.h>

#import <ABI37_0_0React/ABI37_0_0RCTAccessibilityManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTShadowView+Layout.h>
#import <ABI37_0_0React/ABI37_0_0RCTShadowView.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerUtils.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerObserverCoordinator.h>

#import <ABI37_0_0React/ABI37_0_0RCTTextShadowView.h>
#import <ABI37_0_0React/ABI37_0_0RCTTextView.h>

@interface ABI37_0_0RCTTextViewManager () <ABI37_0_0RCTUIManagerObserver>

@end

@implementation ABI37_0_0RCTTextViewManager
{
  NSHashTable<ABI37_0_0RCTTextShadowView *> *_shadowViews;
}

ABI37_0_0RCT_EXPORT_MODULE(ABI37_0_0RCTText)

ABI37_0_0RCT_REMAP_SHADOW_PROPERTY(numberOfLines, maximumNumberOfLines, NSInteger)
ABI37_0_0RCT_REMAP_SHADOW_PROPERTY(ellipsizeMode, lineBreakMode, NSLineBreakMode)
ABI37_0_0RCT_REMAP_SHADOW_PROPERTY(adjustsFontSizeToFit, adjustsFontSizeToFit, BOOL)
ABI37_0_0RCT_REMAP_SHADOW_PROPERTY(minimumFontScale, minimumFontScale, CGFloat)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(onTextLayout, ABI37_0_0RCTDirectEventBlock)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(selectable, BOOL)

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

- (UIView *)view
{
  return [ABI37_0_0RCTTextView new];
}

- (ABI37_0_0RCTShadowView *)shadowView
{
  ABI37_0_0RCTTextShadowView *shadowView = [[ABI37_0_0RCTTextShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

#pragma mark - ABI37_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI37_0_0RCTUIManager *)uiManager
{
  for (ABI37_0_0RCTTextShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI37_0_0RCTTextShadowView *> *shadowViews = _shadowViews;
  ABI37_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI37_0_0RCTTextShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
