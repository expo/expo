/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGRadialGradientManager.h"
#import "ABI36_0_0RNSVGRadialGradient.h"

@implementation ABI36_0_0RNSVGRadialGradientManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGNode *)node
{
  return [ABI36_0_0RNSVGRadialGradient new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI36_0_0RNSVGUnits)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
