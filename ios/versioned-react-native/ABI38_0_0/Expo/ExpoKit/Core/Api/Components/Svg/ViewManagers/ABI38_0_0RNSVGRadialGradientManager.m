/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGRadialGradientManager.h"
#import "ABI38_0_0RNSVGRadialGradient.h"

@implementation ABI38_0_0RNSVGRadialGradientManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGNode *)node
{
  return [ABI38_0_0RNSVGRadialGradient new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI38_0_0RNSVGUnits)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
