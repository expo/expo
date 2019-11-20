/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTInputAccessoryShadowView.h"

#import <ReactABI35_0_0/ABI35_0_0RCTUtils.h>

@implementation ABI35_0_0RCTInputAccessoryShadowView

- (void)insertReactABI35_0_0Subview:(ABI35_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI35_0_0Subview:subview atIndex:atIndex];
  subview.width = (ABI35_0_0YGValue) { ABI35_0_0RCTScreenSize().width, ABI35_0_0YGUnitPoint };
}

@end
