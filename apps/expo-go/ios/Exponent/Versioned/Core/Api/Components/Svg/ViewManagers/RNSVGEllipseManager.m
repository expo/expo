/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGEllipseManager.h"

#import "RNSVGEllipse.h"
#import "RCTConvert+RNSVG.h"

@implementation RNSVGEllipseManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
  return [RNSVGEllipse new];
}

RCT_EXPORT_VIEW_PROPERTY(cx, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(cy, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(rx, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(ry, RNSVGLength*)

@end
