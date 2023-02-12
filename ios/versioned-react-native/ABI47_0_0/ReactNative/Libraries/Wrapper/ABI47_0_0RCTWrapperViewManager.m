/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTWrapperViewManager.h"

#import "ABI47_0_0RCTWrapperShadowView.h"
#import "ABI47_0_0RCTWrapperView.h"

@implementation ABI47_0_0RCTWrapperViewManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RCTShadowView *)shadowView
{
  return [[ABI47_0_0RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[ABI47_0_0RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end
