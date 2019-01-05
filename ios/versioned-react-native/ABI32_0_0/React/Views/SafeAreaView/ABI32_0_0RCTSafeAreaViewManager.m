/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTSafeAreaViewManager.h"

#import "ABI32_0_0RCTSafeAreaShadowView.h"
#import "ABI32_0_0RCTSafeAreaView.h"
#import "ABI32_0_0RCTUIManager.h"

@implementation ABI32_0_0RCTSafeAreaViewManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI32_0_0RCTSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI32_0_0RCTSafeAreaShadowView *)shadowView
{
  return [ABI32_0_0RCTSafeAreaShadowView new];
}

@end
