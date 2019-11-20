/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0RCTInputAccessoryShadowView.h>

#import <ABI36_0_0React/ABI36_0_0RCTUtils.h>

@implementation ABI36_0_0RCTInputAccessoryShadowView

- (void)insertABI36_0_0ReactSubview:(ABI36_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI36_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI36_0_0YGValue) { ABI36_0_0RCTScreenSize().width, ABI36_0_0YGUnitPoint };
}

@end
