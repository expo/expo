/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTTextViewManager.h"

#import <ReactABI30_0_0/ABI30_0_0RCTAccessibilityManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTShadowView+Layout.h>
#import <ReactABI30_0_0/ABI30_0_0RCTShadowView.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerUtils.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI30_0_0RCTTextShadowView.h"
#import "ABI30_0_0RCTTextView.h"

@interface ABI30_0_0RCTTextViewManager () <ABI30_0_0RCTUIManagerObserver>

@end

@implementation ABI30_0_0RCTTextViewManager
{
  NSHashTable<ABI30_0_0RCTTextShadowView *> *_shadowViews;
  CGFloat _fontSizeMultiplier;
}

ABI30_0_0RCT_EXPORT_MODULE(ABI30_0_0RCTText)

ABI30_0_0RCT_REMAP_SHADOW_PROPERTY(numberOfLines, maximumNumberOfLines, NSInteger)
ABI30_0_0RCT_REMAP_SHADOW_PROPERTY(ellipsizeMode, lineBreakMode, NSLineBreakMode)
ABI30_0_0RCT_REMAP_SHADOW_PROPERTY(adjustsFontSizeToFit, adjustsFontSizeToFit, BOOL)
ABI30_0_0RCT_REMAP_SHADOW_PROPERTY(minimumFontScale, minimumFontScale, CGFloat)

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(selectable, BOOL)

- (void)setBridge:(ABI30_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI30_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView *)view
{
  return [ABI30_0_0RCTTextView new];
}

- (ABI30_0_0RCTShadowView *)shadowView
{
  ABI30_0_0RCTTextShadowView *shadowView = [[ABI30_0_0RCTTextShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

#pragma mark - ABI30_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI30_0_0RCTUIManager *)uiManager
{
  for (ABI30_0_0RCTTextShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI30_0_0RCTTextShadowView *> *shadowViews = _shadowViews;
  ABI30_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI30_0_0RCTTextShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
