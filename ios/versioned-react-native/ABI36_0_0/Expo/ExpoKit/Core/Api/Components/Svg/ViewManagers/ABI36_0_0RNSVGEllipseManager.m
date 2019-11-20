/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGEllipseManager.h"

#import "ABI36_0_0RNSVGEllipse.h"
#import "ABI36_0_0RCTConvert+RNSVG.h"

@implementation ABI36_0_0RNSVGEllipseManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGRenderable *)node
{
  return [ABI36_0_0RNSVGEllipse new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI36_0_0RNSVGLength*)

@end
