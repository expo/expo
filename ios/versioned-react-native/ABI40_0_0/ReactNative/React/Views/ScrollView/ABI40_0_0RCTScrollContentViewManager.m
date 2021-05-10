/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTScrollContentViewManager.h"

#import "ABI40_0_0RCTScrollContentShadowView.h"
#import "ABI40_0_0RCTScrollContentView.h"

@implementation ABI40_0_0RCTScrollContentViewManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RCTScrollContentView *)view
{
  return [ABI40_0_0RCTScrollContentView new];
}

- (ABI40_0_0RCTShadowView *)shadowView
{
  return [ABI40_0_0RCTScrollContentShadowView new];
}

@end
