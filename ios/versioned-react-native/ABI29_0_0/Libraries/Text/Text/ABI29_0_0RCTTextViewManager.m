/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTTextViewManager.h"

#import <ReactABI29_0_0/ABI29_0_0RCTAccessibilityManager.h>
#import <ReactABI29_0_0/ABI29_0_0RCTShadowView+Layout.h>
#import <ReactABI29_0_0/ABI29_0_0RCTShadowView.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManager.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManagerUtils.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI29_0_0RCTTextShadowView.h"
#import "ABI29_0_0RCTTextView.h"

@interface ABI29_0_0RCTTextViewManager () <ABI29_0_0RCTUIManagerObserver>

@end

@implementation ABI29_0_0RCTTextViewManager
{
  NSHashTable<ABI29_0_0RCTTextShadowView *> *_shadowViews;
  CGFloat _fontSizeMultiplier;
}

ABI29_0_0RCT_EXPORT_MODULE(ABI29_0_0RCTText)

ABI29_0_0RCT_REMAP_SHADOW_PROPERTY(numberOfLines, maximumNumberOfLines, NSInteger)
ABI29_0_0RCT_REMAP_SHADOW_PROPERTY(ellipsizeMode, lineBreakMode, NSLineBreakMode)
ABI29_0_0RCT_REMAP_SHADOW_PROPERTY(adjustsFontSizeToFit, adjustsFontSizeToFit, BOOL)
ABI29_0_0RCT_REMAP_SHADOW_PROPERTY(minimumFontScale, minimumFontScale, CGFloat)

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(selectable, BOOL)

- (void)setBridge:(ABI29_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI29_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView *)view
{
  return [ABI29_0_0RCTTextView new];
}

- (ABI29_0_0RCTShadowView *)shadowView
{
  ABI29_0_0RCTTextShadowView *shadowView = [[ABI29_0_0RCTTextShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

#pragma mark - ABI29_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI29_0_0RCTUIManager *)uiManager
{
  for (ABI29_0_0RCTTextShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  NSHashTable<ABI29_0_0RCTTextShadowView *> *shadowViews = _shadowViews;
  ABI29_0_0RCTExecuteOnUIManagerQueue(^{
    for (ABI29_0_0RCTTextShadowView *shadowView in shadowViews) {
      shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
      [shadowView dirtyLayout];
    }

    [self.bridge.uiManager setNeedsLayout];
  });
}

@end
