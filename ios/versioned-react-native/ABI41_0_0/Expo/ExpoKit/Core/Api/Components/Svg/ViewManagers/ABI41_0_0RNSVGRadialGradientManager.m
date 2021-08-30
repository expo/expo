/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGRadialGradientManager.h"
#import "ABI41_0_0RNSVGRadialGradient.h"

@implementation ABI41_0_0RNSVGRadialGradientManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGNode *)node
{
  return [ABI41_0_0RNSVGRadialGradient new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI41_0_0RNSVGUnits)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
