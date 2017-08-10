/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0ARTGroupManager.h"

#import "ABI20_0_0ARTGroup.h"
#import "ABI20_0_0RCTConvert+ART.h"

@implementation ABI20_0_0ARTGroupManager

ABI20_0_0RCT_EXPORT_MODULE()

- (ABI20_0_0ARTNode *)node
{
  return [ABI20_0_0ARTGroup new];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(clipping, CGRect)

@end
