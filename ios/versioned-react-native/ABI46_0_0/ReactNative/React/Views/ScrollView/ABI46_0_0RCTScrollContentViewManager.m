/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTScrollContentViewManager.h"

#import "ABI46_0_0RCTScrollContentShadowView.h"
#import "ABI46_0_0RCTScrollContentView.h"

@implementation ABI46_0_0RCTScrollContentViewManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RCTScrollContentView *)view
{
  return [ABI46_0_0RCTScrollContentView new];
}

- (ABI46_0_0RCTShadowView *)shadowView
{
  return [ABI46_0_0RCTScrollContentShadowView new];
}

@end
