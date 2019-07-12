/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0ARTGroupManager.h"

#import "ABI31_0_0ARTGroup.h"
#import "ABI31_0_0RCTConvert+ART.h"

@implementation ABI31_0_0ARTGroupManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0ARTNode *)node
{
  return [ABI31_0_0ARTGroup new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(clipping, CGRect)

@end
