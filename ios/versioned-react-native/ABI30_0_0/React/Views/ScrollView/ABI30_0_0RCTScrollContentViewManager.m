/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTScrollContentViewManager.h"

#import "ABI30_0_0RCTScrollContentShadowView.h"
#import "ABI30_0_0RCTScrollContentView.h"

@implementation ABI30_0_0RCTScrollContentViewManager

ABI30_0_0RCT_EXPORT_MODULE()

- (ABI30_0_0RCTScrollContentView *)view
{
  return [ABI30_0_0RCTScrollContentView new];
}

- (ABI30_0_0RCTShadowView *)shadowView
{
  return [ABI30_0_0RCTScrollContentShadowView new];
}

@end
