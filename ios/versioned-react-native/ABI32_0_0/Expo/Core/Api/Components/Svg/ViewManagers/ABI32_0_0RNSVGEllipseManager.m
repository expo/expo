/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGEllipseManager.h"

#import "ABI32_0_0RNSVGEllipse.h"
#import "ABI32_0_0RCTConvert+RNSVG.h"

@implementation ABI32_0_0RNSVGEllipseManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGRenderable *)node
{
  return [ABI32_0_0RNSVGEllipse new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI32_0_0RNSVGLength*)

@end
