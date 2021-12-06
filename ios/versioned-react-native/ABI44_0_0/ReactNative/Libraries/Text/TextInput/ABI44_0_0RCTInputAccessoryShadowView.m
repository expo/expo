/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTInputAccessoryShadowView.h>

#import <ABI44_0_0React/ABI44_0_0RCTUtils.h>

@implementation ABI44_0_0RCTInputAccessoryShadowView

- (void)insertABI44_0_0ReactSubview:(ABI44_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI44_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI44_0_0YGValue) { ABI44_0_0RCTScreenSize().width, ABI44_0_0YGUnitPoint };
}

@end
