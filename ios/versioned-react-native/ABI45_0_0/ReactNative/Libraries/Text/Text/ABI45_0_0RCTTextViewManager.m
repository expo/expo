/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTTextViewManager.h>

#import <ABI45_0_0React/ABI45_0_0RCTShadowView+Layout.h>
#import <ABI45_0_0React/ABI45_0_0RCTShadowView.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManagerUtils.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManagerObserverCoordinator.h>

#import <ABI45_0_0React/ABI45_0_0RCTTextShadowView.h>
#import <ABI45_0_0React/ABI45_0_0RCTTextView.h>

@interface ABI45_0_0RCTTextViewManager () <ABI45_0_0RCTUIManagerObserver>

@end

@implementation ABI45_0_0RCTTextViewManager
{
  NSHashTable<ABI45_0_0RCTTextShadowView *> *_shadowViews;
}

ABI45_0_0RCT_EXPORT_MODULE(ABI45_0_0RCTText)

ABI45_0_0RCT_REMAP_SHADOW_PROPERTY(numberOfLines, maximumNumberOfLines, NSInteger)
ABI45_0_0RCT_REMAP_SHADOW_PROPERTY(ellipsizeMode, lineBreakMode, NSLineBreakMode)
ABI45_0_0RCT_REMAP_SHADOW_PROPERTY(adjustsFontSizeToFit, adjustsFontSizeToFit, BOOL)
ABI45_0_0RCT_REMAP_SHADOW_PROPERTY(minimumFontScale, minimumFontScale, CGFloat)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(onTextLayout, ABI45_0_0RCTDirectEventBlock)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(selectable, BOOL)

- (void)setBridge:(ABI45_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:@"ABI45_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification"
                                             object:[bridge moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES]];
}

- (UIView *)view
{
  return [ABI45_0_0RCTTextView new];
}

- (ABI45_0_0RCTShadowView *)shadowView
{
  ABI45_0_0RCTTextShadowView *shadowView = [[ABI45_0_0RCTTextShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = [[[self.bridge moduleForName:@"AccessibilityManager"]
                                                   valueForKey:@"multiplier"] floatValue];
  [_shadowViews addObject:shadowView];
  return shadowView;
}

#pragma mark - ABI45_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI45_0_0RCTUIManager *)uiManager
{
  for (ABI45_0_0RCTTextShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = [[[self.bridge moduleForName:@"AccessibilityManager"]
                                 valueForKey:@"multiplier"] floatValue];

  NSHashTable<ABI45_0_0RCTTextShadowView *> *shadowViews = _shadowViews;
  ABI45_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI45_0_0RCTTextShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
