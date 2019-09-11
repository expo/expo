/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0ARTShapeManager.h"

#import "ABI35_0_0ARTShape.h"
#import "ABI35_0_0RCTConvert+ART.h"

@implementation ABI35_0_0ARTShapeManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0ARTRenderable *)node
{
  return [ABI35_0_0ARTShape new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(d, CGPath)

@end
