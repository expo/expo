/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGRadialGradientManager.h"
#import "ABI40_0_0RNSVGRadialGradient.h"

@implementation ABI40_0_0RNSVGRadialGradientManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGNode *)node
{
  return [ABI40_0_0RNSVGRadialGradient new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI40_0_0RNSVGUnits)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
