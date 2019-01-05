/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGRadialGradientManager.h"
#import "ABI32_0_0RNSVGRadialGradient.h"

@implementation ABI32_0_0RNSVGRadialGradientManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGNode *)node
{
  return [ABI32_0_0RNSVGRadialGradient new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI32_0_0RNSVGUnits)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
