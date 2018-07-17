/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTVirtualTextShadowView.h"

#import <ReactABI29_0_0/ABI29_0_0RCTShadowView+Layout.h>
#import <ABI29_0_0yoga/ABI29_0_0Yoga.h>

#import "ABI29_0_0RCTRawTextShadowView.h"

@implementation ABI29_0_0RCTVirtualTextShadowView {
  BOOL _isLayoutDirty;
}

#pragma mark - Life Cycle

- (void)insertReactABI29_0_0Subview:(ABI29_0_0RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI29_0_0Subview:subview atIndex:index];

  [self dirtyLayout];

  if (![subview isKindOfClass:[ABI29_0_0RCTVirtualTextShadowView class]]) {
    ABI29_0_0YGNodeSetDirtiedFunc(subview.yogaNode, ABI29_0_0RCTVirtualTextShadowViewYogaNodeDirtied);
  }

}

- (void)removeReactABI29_0_0Subview:(ABI29_0_0RCTShadowView *)subview
{
  if (![subview isKindOfClass:[ABI29_0_0RCTVirtualTextShadowView class]]) {
    ABI29_0_0YGNodeSetDirtiedFunc(subview.yogaNode, NULL);
  }

  [self dirtyLayout];

  [super removeReactABI29_0_0Subview:subview];
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

static void ABI29_0_0RCTVirtualTextShadowViewYogaNodeDirtied(ABI29_0_0YGNodeRef node)
{
  ABI29_0_0RCTShadowView *shadowView = (__bridge ABI29_0_0RCTShadowView *)ABI29_0_0YGNodeGetContext(node);

  ABI29_0_0RCTVirtualTextShadowView *virtualTextShadowView =
    (ABI29_0_0RCTVirtualTextShadowView *)shadowView.ReactABI29_0_0Superview;

  [virtualTextShadowView dirtyLayout];
}

@end
