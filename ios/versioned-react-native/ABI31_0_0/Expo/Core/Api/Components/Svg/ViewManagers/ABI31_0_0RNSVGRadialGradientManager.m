/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGRadialGradientManager.h"
#import "ABI31_0_0RNSVGRadialGradient.h"

@implementation ABI31_0_0RNSVGRadialGradientManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGNode *)node
{
  return [ABI31_0_0RNSVGRadialGradient new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI31_0_0RNSVGUnits)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
