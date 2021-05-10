/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0ARTShapeManager.h>

#import <ABI40_0_0React/ABI40_0_0ARTShape.h>
#import "ABI40_0_0RCTConvert+ART.h"

@implementation ABI40_0_0ARTShapeManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0ARTRenderable *)node
{
  return [ABI40_0_0ARTShape new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(d, CGPath)

@end
