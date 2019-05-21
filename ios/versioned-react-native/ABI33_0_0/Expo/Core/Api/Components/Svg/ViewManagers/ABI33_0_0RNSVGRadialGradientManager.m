/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGRadialGradientManager.h"
#import "ABI33_0_0RNSVGRadialGradient.h"

@implementation ABI33_0_0RNSVGRadialGradientManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGNode *)node
{
  return [ABI33_0_0RNSVGRadialGradient new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI33_0_0RNSVGUnits)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
