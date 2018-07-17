/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0ARTGroupManager.h"

#import "ABI29_0_0ARTGroup.h"
#import "ABI29_0_0RCTConvert+ART.h"

@implementation ABI29_0_0ARTGroupManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0ARTNode *)node
{
  return [ABI29_0_0ARTGroup new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(clipping, CGRect)

@end
