/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNSVGEllipseManager.h"

#import "ABI34_0_0RNSVGEllipse.h"
#import "ABI34_0_0RCTConvert+RNSVG.h"

@implementation ABI34_0_0RNSVGEllipseManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0RNSVGRenderable *)node
{
  return [ABI34_0_0RNSVGEllipse new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI34_0_0RNSVGLength*)

@end
