/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTScrollContentViewManager.h"

#import "ABI26_0_0RCTScrollContentShadowView.h"
#import "ABI26_0_0RCTScrollContentView.h"

@implementation ABI26_0_0RCTScrollContentViewManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RCTScrollContentView *)view
{
  return [ABI26_0_0RCTScrollContentView new];
}

- (ABI26_0_0RCTShadowView *)shadowView
{
  return [ABI26_0_0RCTScrollContentShadowView new];
}

@end
