/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTVirtualTextShadowView.h"

#import <ReactABI28_0_0/ABI28_0_0RCTShadowView+Layout.h>
#import <YogaABI28_0_0/ABI28_0_0Yoga.h>

#import "ABI28_0_0RCTRawTextShadowView.h"

@implementation ABI28_0_0RCTVirtualTextShadowView {
  BOOL _isLayoutDirty;
}

#pragma mark - Life Cycle

- (void)insertReactABI28_0_0Subview:(ABI28_0_0RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI28_0_0Subview:subview atIndex:index];

  [self dirtyLayout];

  if (![subview isKindOfClass:[ABI28_0_0RCTVirtualTextShadowView class]]) {
    ABI28_0_0YGNodeSetDirtiedFunc(subview.yogaNode, ABI28_0_0RCTVirtualTextShadowViewYogaNodeDirtied);
  }

}

- (void)removeReactABI28_0_0Subview:(ABI28_0_0RCTShadowView *)subview
{
  if (![subview isKindOfClass:[ABI28_0_0RCTVirtualTextShadowView class]]) {
    ABI28_0_0YGNodeSetDirtiedFunc(subview.yogaNode, NULL);
  }

  [self dirtyLayout];

  [super removeReactABI28_0_0Subview:subview];
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

static void ABI28_0_0RCTVirtualTextShadowViewYogaNodeDirtied(ABI28_0_0YGNodeRef node)
{
  ABI28_0_0RCTShadowView *shadowView = (__bridge ABI28_0_0RCTShadowView *)ABI28_0_0YGNodeGetContext(node);

  ABI28_0_0RCTVirtualTextShadowView *virtualTextShadowView =
    (ABI28_0_0RCTVirtualTextShadowView *)shadowView.ReactABI28_0_0Superview;

  [virtualTextShadowView dirtyLayout];
}

@end
