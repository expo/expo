/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTSafeAreaViewManager.h"

#import "ABI40_0_0RCTSafeAreaShadowView.h"
#import "ABI40_0_0RCTSafeAreaView.h"
#import "ABI40_0_0RCTUIManager.h"

@implementation ABI40_0_0RCTSafeAreaViewManager

ABI40_0_0RCT_EXPORT_MODULE()

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(emulateUnlessSupported, BOOL)

- (UIView *)view
{
  return [[ABI40_0_0RCTSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI40_0_0RCTSafeAreaShadowView *)shadowView
{
  return [ABI40_0_0RCTSafeAreaShadowView new];
}

@end
