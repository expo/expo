/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTInputAccessoryShadowView.h>

#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>

@implementation ABI41_0_0RCTInputAccessoryShadowView

- (void)insertABI41_0_0ReactSubview:(ABI41_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI41_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI41_0_0YGValue) { ABI41_0_0RCTScreenSize().width, ABI41_0_0YGUnitPoint };
}

@end
