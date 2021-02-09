/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTInputAccessoryShadowView.h>

#import <ABI38_0_0React/ABI38_0_0RCTUtils.h>

@implementation ABI38_0_0RCTInputAccessoryShadowView

- (void)insertABI38_0_0ReactSubview:(ABI38_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI38_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI38_0_0YGValue) { ABI38_0_0RCTScreenSize().width, ABI38_0_0YGUnitPoint };
}

@end
