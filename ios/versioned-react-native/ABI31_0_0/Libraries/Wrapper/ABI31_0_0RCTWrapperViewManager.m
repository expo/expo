// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import "ABI31_0_0RCTWrapperViewManager.h"

#import "ABI31_0_0RCTWrapperShadowView.h"
#import "ABI31_0_0RCTWrapperView.h"

@implementation ABI31_0_0RCTWrapperViewManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RCTShadowView *)shadowView
{
  return [[ABI31_0_0RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[ABI31_0_0RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end
