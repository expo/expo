/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGRadialGradientManager.h"
#import "ABI37_0_0RNSVGRadialGradient.h"

@implementation ABI37_0_0RNSVGRadialGradientManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGNode *)node
{
  return [ABI37_0_0RNSVGRadialGradient new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI37_0_0RNSVGUnits)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
