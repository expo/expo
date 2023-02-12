/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGEllipseManager.h"

#import "ABI46_0_0RNSVGEllipse.h"
#import "ABI46_0_0RCTConvert+RNSVG.h"

@implementation ABI46_0_0RNSVGEllipseManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGRenderable *)node
{
  return [ABI46_0_0RNSVGEllipse new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI46_0_0RNSVGLength*)

@end
