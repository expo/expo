/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0ARTGroupManager.h>

#import <ABI42_0_0React/ABI42_0_0ARTGroup.h>
#import "ABI42_0_0RCTConvert+ART.h"

@implementation ABI42_0_0ARTGroupManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0ARTNode *)node
{
  return [ABI42_0_0ARTGroup new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(clipping, CGRect)

@end
