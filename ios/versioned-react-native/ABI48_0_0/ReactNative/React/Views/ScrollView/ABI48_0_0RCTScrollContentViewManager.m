/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTScrollContentViewManager.h"

#import "ABI48_0_0RCTScrollContentShadowView.h"
#import "ABI48_0_0RCTScrollContentView.h"

@implementation ABI48_0_0RCTScrollContentViewManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RCTScrollContentView *)view
{
  return [ABI48_0_0RCTScrollContentView new];
}

- (ABI48_0_0RCTShadowView *)shadowView
{
  return [ABI48_0_0RCTScrollContentShadowView new];
}

@end
