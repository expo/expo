/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTInputAccessoryShadowView.h>

#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>

@implementation ABI43_0_0RCTInputAccessoryShadowView

- (void)insertABI43_0_0ReactSubview:(ABI43_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI43_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI43_0_0YGValue) { ABI43_0_0RCTScreenSize().width, ABI43_0_0YGUnitPoint };
}

@end
