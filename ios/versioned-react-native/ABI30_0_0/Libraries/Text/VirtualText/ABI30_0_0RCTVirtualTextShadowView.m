/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTVirtualTextShadowView.h"

#import <ReactABI30_0_0/ABI30_0_0RCTShadowView+Layout.h>
#import <ABI30_0_0yoga/ABI30_0_0Yoga.h>

#import "ABI30_0_0RCTRawTextShadowView.h"

@implementation ABI30_0_0RCTVirtualTextShadowView {
  BOOL _isLayoutDirty;
}

#pragma mark - Life Cycle

- (void)insertReactABI30_0_0Subview:(ABI30_0_0RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI30_0_0Subview:subview atIndex:index];

  [self dirtyLayout];

  if (![subview isKindOfClass:[ABI30_0_0RCTVirtualTextShadowView class]]) {
    ABI30_0_0YGNodeSetDirtiedFunc(subview.yogaNode, ABI30_0_0RCTVirtualTextShadowViewYogaNodeDirtied);
  }

}

- (void)removeReactABI30_0_0Subview:(ABI30_0_0RCTShadowView *)subview
{
  if (![subview isKindOfClass:[ABI30_0_0RCTVirtualTextShadowView class]]) {
    ABI30_0_0YGNodeSetDirtiedFunc(subview.yogaNode, NULL);
  }

  [self dirtyLayout];

  [super removeReactABI30_0_0Subview:subview];
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

static void ABI30_0_0RCTVirtualTextShadowViewYogaNodeDirtied(ABI30_0_0YGNodeRef node)
{
  ABI30_0_0RCTShadowView *shadowView = (__bridge ABI30_0_0RCTShadowView *)ABI30_0_0YGNodeGetContext(node);

  ABI30_0_0RCTVirtualTextShadowView *virtualTextShadowView =
    (ABI30_0_0RCTVirtualTextShadowView *)shadowView.ReactABI30_0_0Superview;

  [virtualTextShadowView dirtyLayout];
}

@end
