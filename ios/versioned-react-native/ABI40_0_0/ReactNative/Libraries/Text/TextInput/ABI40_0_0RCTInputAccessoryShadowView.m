/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTInputAccessoryShadowView.h>

#import <ABI40_0_0React/ABI40_0_0RCTUtils.h>

@implementation ABI40_0_0RCTInputAccessoryShadowView

- (void)insertABI40_0_0ReactSubview:(ABI40_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI40_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI40_0_0YGValue) { ABI40_0_0RCTScreenSize().width, ABI40_0_0YGUnitPoint };
}

@end
