// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import "ABI35_0_0RCTWrapperViewManager.h"

#import "ABI35_0_0RCTWrapperShadowView.h"
#import "ABI35_0_0RCTWrapperView.h"

@implementation ABI35_0_0RCTWrapperViewManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RCTShadowView *)shadowView
{
  return [[ABI35_0_0RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[ABI35_0_0RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end
