/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTTextViewManager.h"

#import <ReactABI32_0_0/ABI32_0_0RCTAccessibilityManager.h>
#import <ReactABI32_0_0/ABI32_0_0RCTShadowView+Layout.h>
#import <ReactABI32_0_0/ABI32_0_0RCTShadowView.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManager.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManagerUtils.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI32_0_0RCTTextShadowView.h"
#import "ABI32_0_0RCTTextView.h"

@interface ABI32_0_0RCTTextViewManager () <ABI32_0_0RCTUIManagerObserver>

@end

@implementation ABI32_0_0RCTTextViewManager
{
  NSHashTable<ABI32_0_0RCTTextShadowView *> *_shadowViews;
  CGFloat _fontSizeMultiplier;
}

ABI32_0_0RCT_EXPORT_MODULE(ABI32_0_0RCTText)

ABI32_0_0RCT_REMAP_SHADOW_PROPERTY(numberOfLines, maximumNumberOfLines, NSInteger)
ABI32_0_0RCT_REMAP_SHADOW_PROPERTY(ellipsizeMode, lineBreakMode, NSLineBreakMode)
ABI32_0_0RCT_REMAP_SHADOW_PROPERTY(adjustsFontSizeToFit, adjustsFontSizeToFit, BOOL)
ABI32_0_0RCT_REMAP_SHADOW_PROPERTY(minimumFontScale, minimumFontScale, CGFloat)

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(selectable, BOOL)

- (void)setBridge:(ABI32_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI32_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView *)view
{
  return [ABI32_0_0RCTTextView new];
}

- (ABI32_0_0RCTShadowView *)shadowView
{
  ABI32_0_0RCTTextShadowView *shadowView = [[ABI32_0_0RCTTextShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

#pragma mark - ABI32_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI32_0_0RCTUIManager *)uiManager
{
  for (ABI32_0_0RCTTextShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI32_0_0RCTTextShadowView *> *shadowViews = _shadowViews;
  ABI32_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI32_0_0RCTTextShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
