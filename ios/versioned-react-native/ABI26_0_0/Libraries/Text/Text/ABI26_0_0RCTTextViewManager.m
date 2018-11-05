/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTTextViewManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTAccessibilityManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView+Layout.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI26_0_0RCTTextShadowView.h"
#import "ABI26_0_0RCTTextView.h"

@interface ABI26_0_0RCTTextViewManager () <ABI26_0_0RCTUIManagerObserver>

@end

@implementation ABI26_0_0RCTTextViewManager
{
  NSHashTable<ABI26_0_0RCTTextShadowView *> *_shadowViews;
  CGFloat _fontSizeMultiplier;
}

ABI26_0_0RCT_EXPORT_MODULE(ABI26_0_0RCTText)

ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(numberOfLines, maximumNumberOfLines, NSInteger)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(ellipsizeMode, lineBreakMode, NSLineBreakMode)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(adjustsFontSizeToFit, adjustsFontSizeToFit, BOOL)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(minimumFontScale, minimumFontScale, CGFloat)

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(selectable, BOOL)

- (void)setBridge:(ABI26_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:ABI26_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView *)view
{
  return [ABI26_0_0RCTTextView new];
}

- (ABI26_0_0RCTShadowView *)shadowView
{
  ABI26_0_0RCTTextShadowView *shadowView = [[ABI26_0_0RCTTextShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

#pragma mark - ABI26_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused ABI26_0_0RCTUIManager *)uiManager
{
  for (ABI26_0_0RCTTextShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  for (ABI26_0_0RCTTextShadowView *shadowView in _shadowViews) {
    shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
    [shadowView dirtyLayout];
  }

  [self.bridge.uiManager setNeedsLayout];
}

@end
