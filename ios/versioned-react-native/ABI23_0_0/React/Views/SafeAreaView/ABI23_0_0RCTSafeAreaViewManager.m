/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTSafeAreaViewManager.h"

#import "ABI23_0_0RCTSafeAreaShadowView.h"
#import "ABI23_0_0RCTSafeAreaView.h"
#import "ABI23_0_0RCTUIManager.h"

@implementation ABI23_0_0RCTSafeAreaViewManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI23_0_0RCTSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI23_0_0RCTSafeAreaShadowView *)shadowView
{
  return [ABI23_0_0RCTSafeAreaShadowView new];
}

@end
