/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTInputAccessoryShadowView.h"

#import <ReactABI33_0_0/ABI33_0_0RCTUtils.h>

@implementation ABI33_0_0RCTInputAccessoryShadowView

- (void)insertReactABI33_0_0Subview:(ABI33_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI33_0_0Subview:subview atIndex:atIndex];
  subview.width = (ABI33_0_0YGValue) { ABI33_0_0RCTScreenSize().width, ABI33_0_0YGUnitPoint };
}

@end
