/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTScrollContentViewManager.h"

#import "ABI37_0_0RCTScrollContentShadowView.h"
#import "ABI37_0_0RCTScrollContentView.h"

@implementation ABI37_0_0RCTScrollContentViewManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RCTScrollContentView *)view
{
  return [ABI37_0_0RCTScrollContentView new];
}

- (ABI37_0_0RCTShadowView *)shadowView
{
  return [ABI37_0_0RCTScrollContentShadowView new];
}

@end
