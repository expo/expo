/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGEllipseManager.h"

#import "ABI40_0_0RNSVGEllipse.h"
#import "ABI40_0_0RCTConvert+RNSVG.h"

@implementation ABI40_0_0RNSVGEllipseManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGRenderable *)node
{
  return [ABI40_0_0RNSVGEllipse new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI40_0_0RNSVGLength*)

@end
