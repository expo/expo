/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTInputAccessoryShadowView.h>

#import <ABI39_0_0React/ABI39_0_0RCTUtils.h>

@implementation ABI39_0_0RCTInputAccessoryShadowView

- (void)insertABI39_0_0ReactSubview:(ABI39_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI39_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI39_0_0YGValue) { ABI39_0_0RCTScreenSize().width, ABI39_0_0YGUnitPoint };
}

@end
