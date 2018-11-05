/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTSafeAreaViewManager.h"

#import "ABI29_0_0RCTSafeAreaShadowView.h"
#import "ABI29_0_0RCTSafeAreaView.h"
#import "ABI29_0_0RCTUIManager.h"

@implementation ABI29_0_0RCTSafeAreaViewManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI29_0_0RCTSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI29_0_0RCTSafeAreaShadowView *)shadowView
{
  return [ABI29_0_0RCTSafeAreaShadowView new];
}

@end
