/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTVirtualTextShadowView.h"

#import <ReactABI31_0_0/ABI31_0_0RCTShadowView+Layout.h>
#import <ABI31_0_0yoga/ABI31_0_0Yoga.h>

#import "ABI31_0_0RCTRawTextShadowView.h"

@implementation ABI31_0_0RCTVirtualTextShadowView {
  BOOL _isLayoutDirty;
}

#pragma mark - Life Cycle

- (void)insertReactABI31_0_0Subview:(ABI31_0_0RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI31_0_0Subview:subview atIndex:index];

  [self dirtyLayout];

  if (![subview isKindOfClass:[ABI31_0_0RCTVirtualTextShadowView class]]) {
    ABI31_0_0YGNodeSetDirtiedFunc(subview.yogaNode, ABI31_0_0RCTVirtualTextShadowViewYogaNodeDirtied);
  }

}

- (void)removeReactABI31_0_0Subview:(ABI31_0_0RCTShadowView *)subview
{
  if (![subview isKindOfClass:[ABI31_0_0RCTVirtualTextShadowView class]]) {
    ABI31_0_0YGNodeSetDirtiedFunc(subview.yogaNode, NULL);
  }

  [self dirtyLayout];

  [super removeReactABI31_0_0Subview:subview];
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

static void ABI31_0_0RCTVirtualTextShadowViewYogaNodeDirtied(ABI31_0_0YGNodeRef node)
{
  ABI31_0_0RCTShadowView *shadowView = (__bridge ABI31_0_0RCTShadowView *)ABI31_0_0YGNodeGetContext(node);

  ABI31_0_0RCTVirtualTextShadowView *virtualTextShadowView =
    (ABI31_0_0RCTVirtualTextShadowView *)shadowView.ReactABI31_0_0Superview;

  [virtualTextShadowView dirtyLayout];
}

@end
