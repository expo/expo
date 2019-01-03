/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTInputAccessoryShadowView.h"

#import <ReactABI32_0_0/ABI32_0_0RCTUtils.h>

@implementation ABI32_0_0RCTInputAccessoryShadowView

- (void)insertReactABI32_0_0Subview:(ABI32_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI32_0_0Subview:subview atIndex:atIndex];
  subview.width = (ABI32_0_0YGValue) { ABI32_0_0RCTScreenSize().width, ABI32_0_0YGUnitPoint };
}

@end
