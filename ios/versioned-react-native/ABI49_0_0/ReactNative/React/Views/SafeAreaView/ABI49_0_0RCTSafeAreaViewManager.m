/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTSafeAreaViewManager.h"

#import "ABI49_0_0RCTSafeAreaShadowView.h"
#import "ABI49_0_0RCTSafeAreaView.h"
#import "ABI49_0_0RCTUIManager.h"

@implementation ABI49_0_0RCTSafeAreaViewManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI49_0_0RCTSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI49_0_0RCTSafeAreaShadowView *)shadowView
{
  return [ABI49_0_0RCTSafeAreaShadowView new];
}

@end
