/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGRadialGradientManager.h"
#import "ABI46_0_0RNSVGRadialGradient.h"

@implementation ABI46_0_0RNSVGRadialGradientManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGNode *)node
{
  return [ABI46_0_0RNSVGRadialGradient new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI46_0_0RNSVGUnits)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
