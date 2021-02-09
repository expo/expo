/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTTextViewManager.h>

#import <ABI39_0_0React/ABI39_0_0RCTShadowView+Layout.h>
#import <ABI39_0_0React/ABI39_0_0RCTShadowView.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManager.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManagerUtils.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManagerObserverCoordinator.h>

#import <ABI39_0_0React/ABI39_0_0RCTTextShadowView.h>
#import <ABI39_0_0React/ABI39_0_0RCTTextView.h>

@interface ABI39_0_0RCTTextViewManager () <ABI39_0_0RCTUIManagerObserver>

@end

@implementation ABI39_0_0RCTTextViewManager
{
  NSHashTable<ABI39_0_0RCTTextShadowView *> *_shadowViews;
}

ABI39_0_0RCT_EXPORT_MODULE(ABI39_0_0RCTText)

ABI39_0_0RCT_REMAP_SHADOW_PROPERTY(numberOfLines, maximumNumberOfLines, NSInteger)
ABI39_0_0RCT_REMAP_SHADOW_PROPERTY(ellipsizeMode, lineBreakMode, NSLineBreakMode)
ABI39_0_0RCT_REMAP_SHADOW_PROPERTY(adjustsFontSizeToFit, adjustsFontSizeToFit, BOOL)
ABI39_0_0RCT_REMAP_SHADOW_PROPERTY(minimumFontScale, minimumFontScale, CGFloat)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(onTextLayout, ABI39_0_0RCTDirectEventBlock)

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(selectable, BOOL)

- (void)setBridge:(ABI39_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:@"ABI39_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification"
                                             object:[bridge moduleForName:@"AccessibilityManager"
                                                    lazilyLoadIfNecessary:YES]];
}

- (UIView *)view
{
  return [ABI39_0_0RCTTextView new];
}

- (ABI39_0_0RCTShadowView *)shadowView
{
  ABI39_0_0RCTTextShadowView *shadowView = [[ABI39_0_0RCTTextShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = [[[self.bridge moduleForName:@"AccessibilityManager"]
                                                   valueForKey:@"multiplier"] floatValue];
  [_shadowViews addObject:shadowView];
  return shadowView;
}

#pragma mark - ABI39_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI39_0_0RCTUIManager *)uiManager
{
  for (ABI39_0_0RCTTextShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = [[[self.bridge moduleForName:@"AccessibilityManager"]
                                 valueForKey:@"multiplier"] floatValue];

  NSHashTable<ABI39_0_0RCTTextShadowView *> *shadowViews = _shadowViews;
  ABI39_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI39_0_0RCTTextShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
