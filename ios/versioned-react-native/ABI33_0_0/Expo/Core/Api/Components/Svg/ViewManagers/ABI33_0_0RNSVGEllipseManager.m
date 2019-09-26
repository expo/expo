/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGEllipseManager.h"

#import "ABI33_0_0RNSVGEllipse.h"
#import "ABI33_0_0RCTConvert+RNSVG.h"

@implementation ABI33_0_0RNSVGEllipseManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGRenderable *)node
{
  return [ABI33_0_0RNSVGEllipse new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI33_0_0RNSVGLength*)

@end
