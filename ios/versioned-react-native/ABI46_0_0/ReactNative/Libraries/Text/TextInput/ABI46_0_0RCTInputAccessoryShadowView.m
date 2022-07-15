/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTInputAccessoryShadowView.h>

#import <ABI46_0_0React/ABI46_0_0RCTUtils.h>

@implementation ABI46_0_0RCTInputAccessoryShadowView

- (void)insertABI46_0_0ReactSubview:(ABI46_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI46_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI46_0_0YGValue) { ABI46_0_0RCTScreenSize().width, ABI46_0_0YGUnitPoint };
}

@end
