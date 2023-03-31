/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTInputAccessoryShadowView.h>

#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>

@implementation ABI48_0_0RCTInputAccessoryShadowView

- (void)insertABI48_0_0ReactSubview:(ABI48_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI48_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI48_0_0YGValue){ABI48_0_0RCTScreenSize().width, ABI48_0_0YGUnitPoint};
}

@end
