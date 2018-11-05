/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTSafeAreaViewManager.h"

#import "ABI28_0_0RCTSafeAreaShadowView.h"
#import "ABI28_0_0RCTSafeAreaView.h"
#import "ABI28_0_0RCTUIManager.h"

@implementation ABI28_0_0RCTSafeAreaViewManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI28_0_0RCTSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI28_0_0RCTSafeAreaShadowView *)shadowView
{
  return [ABI28_0_0RCTSafeAreaShadowView new];
}

@end
