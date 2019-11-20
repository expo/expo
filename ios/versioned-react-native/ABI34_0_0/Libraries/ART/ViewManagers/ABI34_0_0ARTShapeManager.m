/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0ARTShapeManager.h"

#import "ABI34_0_0ARTShape.h"
#import "ABI34_0_0RCTConvert+ART.h"

@implementation ABI34_0_0ARTShapeManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0ARTRenderable *)node
{
  return [ABI34_0_0ARTShape new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(d, CGPath)

@end
