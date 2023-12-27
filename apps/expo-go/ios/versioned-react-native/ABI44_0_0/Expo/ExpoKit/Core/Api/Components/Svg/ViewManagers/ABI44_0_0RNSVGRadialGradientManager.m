/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGRadialGradientManager.h"
#import "ABI44_0_0RNSVGRadialGradient.h"

@implementation ABI44_0_0RNSVGRadialGradientManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGNode *)node
{
  return [ABI44_0_0RNSVGRadialGradient new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI44_0_0RNSVGUnits)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
