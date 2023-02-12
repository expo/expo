/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTInputAccessoryShadowView.h>

#import <ABI47_0_0React/ABI47_0_0RCTUtils.h>

@implementation ABI47_0_0RCTInputAccessoryShadowView

- (void)insertABI47_0_0ReactSubview:(ABI47_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI47_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI47_0_0YGValue) { ABI47_0_0RCTScreenSize().width, ABI47_0_0YGUnitPoint };
}

@end
