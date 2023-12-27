/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGEllipseManager.h"

#import "ABI44_0_0RNSVGEllipse.h"
#import "ABI44_0_0RCTConvert+RNSVG.h"

@implementation ABI44_0_0RNSVGEllipseManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGRenderable *)node
{
  return [ABI44_0_0RNSVGEllipse new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI44_0_0RNSVGLength*)

@end
