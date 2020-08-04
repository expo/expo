/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGEllipseManager.h"

#import "ABI38_0_0RNSVGEllipse.h"
#import "ABI38_0_0RCTConvert+RNSVG.h"

@implementation ABI38_0_0RNSVGEllipseManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGRenderable *)node
{
  return [ABI38_0_0RNSVGEllipse new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI38_0_0RNSVGLength*)

@end
