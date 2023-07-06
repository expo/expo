/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTInputAccessoryShadowView.h>

#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>

@implementation ABI49_0_0RCTInputAccessoryShadowView

- (void)insertABI49_0_0ReactSubview:(ABI49_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI49_0_0ReactSubview:subview atIndex:atIndex];
  subview.width = (ABI49_0_0YGValue){ABI49_0_0RCTScreenSize().width, ABI49_0_0YGUnitPoint};
}

@end
