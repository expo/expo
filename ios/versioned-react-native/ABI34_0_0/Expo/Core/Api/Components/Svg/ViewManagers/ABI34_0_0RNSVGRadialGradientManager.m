/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNSVGRadialGradientManager.h"
#import "ABI34_0_0RNSVGRadialGradient.h"

@implementation ABI34_0_0RNSVGRadialGradientManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0RNSVGNode *)node
{
  return [ABI34_0_0RNSVGRadialGradient new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI34_0_0RNSVGUnits)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
