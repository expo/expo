/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0ARTShapeManager.h"

#import "ABI32_0_0ARTShape.h"
#import "ABI32_0_0RCTConvert+ART.h"

@implementation ABI32_0_0ARTShapeManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0ARTRenderable *)node
{
  return [ABI32_0_0ARTShape new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(d, CGPath)

@end
