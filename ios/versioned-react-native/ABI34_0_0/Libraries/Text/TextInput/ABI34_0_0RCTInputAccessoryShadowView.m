/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTInputAccessoryShadowView.h"

#import <ReactABI34_0_0/ABI34_0_0RCTUtils.h>

@implementation ABI34_0_0RCTInputAccessoryShadowView

- (void)insertReactABI34_0_0Subview:(ABI34_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI34_0_0Subview:subview atIndex:atIndex];
  subview.width = (ABI34_0_0YGValue) { ABI34_0_0RCTScreenSize().width, ABI34_0_0YGUnitPoint };
}

@end
