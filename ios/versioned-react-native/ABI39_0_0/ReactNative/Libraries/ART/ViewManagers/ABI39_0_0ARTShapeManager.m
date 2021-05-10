/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0ARTShapeManager.h>

#import <ABI39_0_0React/ABI39_0_0ARTShape.h>
#import "ABI39_0_0RCTConvert+ART.h"

@implementation ABI39_0_0ARTShapeManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0ARTRenderable *)node
{
  return [ABI39_0_0ARTShape new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(d, CGPath)

@end
