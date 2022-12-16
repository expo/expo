/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTSafeAreaViewManager.h"

#import "ABI46_0_0RCTSafeAreaShadowView.h"
#import "ABI46_0_0RCTSafeAreaView.h"
#import "ABI46_0_0RCTUIManager.h"

@implementation ABI46_0_0RCTSafeAreaViewManager

ABI46_0_0RCT_EXPORT_MODULE()

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(emulateUnlessSupported, BOOL)

- (UIView *)view
{
  return [[ABI46_0_0RCTSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI46_0_0RCTSafeAreaShadowView *)shadowView
{
  return [ABI46_0_0RCTSafeAreaShadowView new];
}

@end
