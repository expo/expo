/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RNSVGRadialGradientManager.h"
#import "ABI35_0_0RNSVGRadialGradient.h"

@implementation ABI35_0_0RNSVGRadialGradientManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RNSVGNode *)node
{
  return [ABI35_0_0RNSVGRadialGradient new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI35_0_0RNSVGUnits)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
