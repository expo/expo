/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0ARTGroupManager.h"

#import "ABI32_0_0ARTGroup.h"
#import "ABI32_0_0RCTConvert+ART.h"

@implementation ABI32_0_0ARTGroupManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0ARTNode *)node
{
  return [ABI32_0_0ARTGroup new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(clipping, CGRect)

@end
