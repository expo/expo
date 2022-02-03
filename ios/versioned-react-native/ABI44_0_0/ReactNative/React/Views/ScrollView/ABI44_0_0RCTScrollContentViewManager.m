/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTScrollContentViewManager.h"

#import "ABI44_0_0RCTScrollContentShadowView.h"
#import "ABI44_0_0RCTScrollContentView.h"

@implementation ABI44_0_0RCTScrollContentViewManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RCTScrollContentView *)view
{
  return [ABI44_0_0RCTScrollContentView new];
}

- (ABI44_0_0RCTShadowView *)shadowView
{
  return [ABI44_0_0RCTScrollContentShadowView new];
}

@end
