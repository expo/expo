/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTInputAccessoryShadowView.h>

#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>

@implementation ABI42_0_0RCTInputAccessoryShadowView

- (void)insertABI42_0_0ReactSubview:(ABI42_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI42_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI42_0_0YGValue) { ABI42_0_0RCTScreenSize().width, ABI42_0_0YGUnitPoint };
}

@end
