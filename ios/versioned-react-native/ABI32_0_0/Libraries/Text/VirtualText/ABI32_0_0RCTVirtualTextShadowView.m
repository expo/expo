/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTVirtualTextShadowView.h"

#import <ReactABI32_0_0/ABI32_0_0RCTShadowView+Layout.h>
#import <ABI32_0_0yoga/ABI32_0_0Yoga.h>

#import "ABI32_0_0RCTRawTextShadowView.h"

@implementation ABI32_0_0RCTVirtualTextShadowView {
  BOOL _isLayoutDirty;
}

#pragma mark - Life Cycle

- (void)insertReactABI32_0_0Subview:(ABI32_0_0RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI32_0_0Subview:subview atIndex:index];

  [self dirtyLayout];

  if (![subview isKindOfClass:[ABI32_0_0RCTVirtualTextShadowView class]]) {
    ABI32_0_0YGNodeSetDirtiedFunc(subview.yogaNode, ABI32_0_0RCTVirtualTextShadowViewYogaNodeDirtied);
  }

}

- (void)removeReactABI32_0_0Subview:(ABI32_0_0RCTShadowView *)subview
{
  if (![subview isKindOfClass:[ABI32_0_0RCTVirtualTextShadowView class]]) {
    ABI32_0_0YGNodeSetDirtiedFunc(subview.yogaNode, NULL);
  }

  [self dirtyLayout];

  [super removeReactABI32_0_0Subview:subview];
}

#pragma mark - Layout

- (void)dirtyLayout
{
  [super dirtyLayout];

  if (_isLayoutDirty) {
    return;
  }
  _isLayoutDirty = YES;

  [self.superview dirtyLayout];
}

- (void)clearLayout
{
  _isLayoutDirty = NO;
}

static void ABI32_0_0RCTVirtualTextShadowViewYogaNodeDirtied(ABI32_0_0YGNodeRef node)
{
  ABI32_0_0RCTShadowView *shadowView = (__bridge ABI32_0_0RCTShadowView *)ABI32_0_0YGNodeGetContext(node);

  ABI32_0_0RCTVirtualTextShadowView *virtualTextShadowView =
    (ABI32_0_0RCTVirtualTextShadowView *)shadowView.ReactABI32_0_0Superview;

  [virtualTextShadowView dirtyLayout];
}

@end
