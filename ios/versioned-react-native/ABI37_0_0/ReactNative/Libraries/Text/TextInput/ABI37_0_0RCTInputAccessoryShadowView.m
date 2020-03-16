/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTInputAccessoryShadowView.h>

#import <ABI37_0_0React/ABI37_0_0RCTUtils.h>

@implementation ABI37_0_0RCTInputAccessoryShadowView

- (void)insertABI37_0_0ReactSubview:(ABI37_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI37_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI37_0_0YGValue) { ABI37_0_0RCTScreenSize().width, ABI37_0_0YGUnitPoint };
}

@end
