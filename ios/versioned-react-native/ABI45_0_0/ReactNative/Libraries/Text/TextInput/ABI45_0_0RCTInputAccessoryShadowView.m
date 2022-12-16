/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTInputAccessoryShadowView.h>

#import <ABI45_0_0React/ABI45_0_0RCTUtils.h>

@implementation ABI45_0_0RCTInputAccessoryShadowView

- (void)insertABI45_0_0ReactSubview:(ABI45_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI45_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI45_0_0YGValue) { ABI45_0_0RCTScreenSize().width, ABI45_0_0YGUnitPoint };
}

@end
