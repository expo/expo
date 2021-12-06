/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTWrapperViewManager.h"

#import "ABI44_0_0RCTWrapperShadowView.h"
#import "ABI44_0_0RCTWrapperView.h"

@implementation ABI44_0_0RCTWrapperViewManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RCTShadowView *)shadowView
{
  return [[ABI44_0_0RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[ABI44_0_0RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end
