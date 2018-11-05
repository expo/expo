/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTVirtualTextShadowView.h"

#import <ReactABI27_0_0/ABI27_0_0RCTShadowView+Layout.h>
#import <yogaABI27_0_0/ABI27_0_0yoga.h>

#import "ABI27_0_0RCTRawTextShadowView.h"

@implementation ABI27_0_0RCTVirtualTextShadowView {
  BOOL _isLayoutDirty;
}

#pragma mark - Life Cycle

- (void)insertReactABI27_0_0Subview:(ABI27_0_0RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI27_0_0Subview:subview atIndex:index];

  [self dirtyLayout];

  if (![subview isKindOfClass:[ABI27_0_0RCTVirtualTextShadowView class]]) {
    ABI27_0_0YGNodeSetDirtiedFunc(subview.yogaNode, ABI27_0_0RCTVirtualTextShadowViewYogaNodeDirtied);
  }

}

- (void)removeReactABI27_0_0Subview:(ABI27_0_0RCTShadowView *)subview
{
  if (![subview isKindOfClass:[ABI27_0_0RCTVirtualTextShadowView class]]) {
    ABI27_0_0YGNodeSetDirtiedFunc(subview.yogaNode, NULL);
  }

  [self dirtyLayout];

  [super removeReactABI27_0_0Subview:subview];
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

static void ABI27_0_0RCTVirtualTextShadowViewYogaNodeDirtied(ABI27_0_0YGNodeRef node)
{
  ABI27_0_0RCTShadowView *shadowView = (__bridge ABI27_0_0RCTShadowView *)ABI27_0_0YGNodeGetContext(node);

  ABI27_0_0RCTVirtualTextShadowView *virtualTextShadowView =
    (ABI27_0_0RCTVirtualTextShadowView *)shadowView.ReactABI27_0_0Superview;

  [virtualTextShadowView dirtyLayout];
}

@end
