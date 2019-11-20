/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RNSVGEllipseManager.h"

#import "ABI35_0_0RNSVGEllipse.h"
#import "ABI35_0_0RCTConvert+RNSVG.h"

@implementation ABI35_0_0RNSVGEllipseManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RNSVGRenderable *)node
{
  return [ABI35_0_0RNSVGEllipse new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI35_0_0RNSVGLength*)

@end
