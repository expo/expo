/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTScrollContentViewManager.h"

#import "ABI29_0_0RCTScrollContentShadowView.h"
#import "ABI29_0_0RCTScrollContentView.h"

@implementation ABI29_0_0RCTScrollContentViewManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0RCTScrollContentView *)view
{
  return [ABI29_0_0RCTScrollContentView new];
}

- (ABI29_0_0RCTShadowView *)shadowView
{
  return [ABI29_0_0RCTScrollContentShadowView new];
}

@end
