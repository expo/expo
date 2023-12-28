/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGRadialGradientManager.h"
#import "RNSVGRadialGradient.h"

@implementation RNSVGRadialGradientManager

RCT_EXPORT_MODULE()

- (RNSVGNode *)node
{
  return [RNSVGRadialGradient new];
}

RCT_EXPORT_VIEW_PROPERTY(fx, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(fy, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(cx, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(cy, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(rx, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(ry, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
RCT_EXPORT_VIEW_PROPERTY(gradientUnits, RNSVGUnits)
RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
