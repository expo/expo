/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTInputAccessoryShadowView.h"

#import <ReactABI31_0_0/ABI31_0_0RCTUtils.h>

@implementation ABI31_0_0RCTInputAccessoryShadowView

- (void)insertReactABI31_0_0Subview:(ABI31_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI31_0_0Subview:subview atIndex:atIndex];
  subview.width = (ABI31_0_0YGValue) { ABI31_0_0RCTScreenSize().width, ABI31_0_0YGUnitPoint };
}

@end
