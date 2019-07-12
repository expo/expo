/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTScrollContentViewManager.h"

#import "ABI31_0_0RCTScrollContentShadowView.h"
#import "ABI31_0_0RCTScrollContentView.h"

@implementation ABI31_0_0RCTScrollContentViewManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RCTScrollContentView *)view
{
  return [ABI31_0_0RCTScrollContentView new];
}

- (ABI31_0_0RCTShadowView *)shadowView
{
  return [ABI31_0_0RCTScrollContentShadowView new];
}

@end
