/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTRawTextManager.h"

#import "ABI23_0_0RCTShadowRawText.h"

@implementation ABI23_0_0RCTRawTextManager

ABI23_0_0RCT_EXPORT_MODULE()

- (ABI23_0_0RCTShadowView *)shadowView
{
  return [ABI23_0_0RCTShadowRawText new];
}

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
