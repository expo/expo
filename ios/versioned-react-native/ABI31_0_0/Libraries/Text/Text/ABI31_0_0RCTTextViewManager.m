/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTTextViewManager.h"

#import <ReactABI31_0_0/ABI31_0_0RCTAccessibilityManager.h>
#import <ReactABI31_0_0/ABI31_0_0RCTShadowView+Layout.h>
#import <ReactABI31_0_0/ABI31_0_0RCTShadowView.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManagerUtils.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI31_0_0RCTTextShadowView.h"
#import "ABI31_0_0RCTTextView.h"

@interface ABI31_0_0RCTTextViewManager () <ABI31_0_0RCTUIManagerObserver>

@end

@implementation ABI31_0_0RCTTextViewManager
{
  NSHashTable<ABI31_0_0RCTTextShadowView *> *_shadowViews;
  CGFloat _fontSizeMultiplier;
}

ABI31_0_0RCT_EXPORT_MODULE(ABI31_0_0RCTText)

ABI31_0_0RCT_REMAP_SHADOW_PROPERTY(numberOfLines, maximumNumberOfLines, NSInteger)
ABI31_0_0RCT_REMAP_SHADOW_PROPERTY(ellipsizeMode, lineBreakMode, NSLineBreakMode)
ABI31_0_0RCT_REMAP_SHADOW_PROPERTY(adjustsFontSizeToFit, adjustsFontSizeToFit, BOOL)
ABI31_0_0RCT_REMAP_SHADOW_PROPERTY(minimumFontScale, minimumFontScale, CGFloat)

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(selectable, BOOL)

- (void)setBridge:(ABI31_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI31_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView *)view
{
  return [ABI31_0_0RCTTextView new];
}

- (ABI31_0_0RCTShadowView *)shadowView
{
  ABI31_0_0RCTTextShadowView *shadowView = [[ABI31_0_0RCTTextShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

#pragma mark - ABI31_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI31_0_0RCTUIManager *)uiManager
{
  for (ABI31_0_0RCTTextShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI31_0_0RCTTextShadowView *> *shadowViews = _shadowViews;
  ABI31_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI31_0_0RCTTextShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
