/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGRadialGradientManager.h"
#import "ABI45_0_0RNSVGRadialGradient.h"

@implementation ABI45_0_0RNSVGRadialGradientManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGNode *)node
{
  return [ABI45_0_0RNSVGRadialGradient new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI45_0_0RNSVGUnits)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
