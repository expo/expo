// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import "ABI32_0_0RCTWrapperViewManager.h"

#import "ABI32_0_0RCTWrapperShadowView.h"
#import "ABI32_0_0RCTWrapperView.h"

@implementation ABI32_0_0RCTWrapperViewManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RCTShadowView *)shadowView
{
  return [[ABI32_0_0RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[ABI32_0_0RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end
