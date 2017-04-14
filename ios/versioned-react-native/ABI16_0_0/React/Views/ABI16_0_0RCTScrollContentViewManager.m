/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTScrollContentViewManager.h"

#import "ABI16_0_0RCTScrollContentShadowView.h"

@implementation ABI16_0_0RCTScrollContentViewManager

ABI16_0_0RCT_EXPORT_MODULE()

- (ABI16_0_0RCTShadowView *)shadowView
{
  return [ABI16_0_0RCTScrollContentShadowView new];
}

@end
