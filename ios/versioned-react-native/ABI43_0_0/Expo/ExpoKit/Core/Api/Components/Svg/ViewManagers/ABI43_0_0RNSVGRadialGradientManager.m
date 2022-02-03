/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGRadialGradientManager.h"
#import "ABI43_0_0RNSVGRadialGradient.h"

@implementation ABI43_0_0RNSVGRadialGradientManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGNode *)node
{
  return [ABI43_0_0RNSVGRadialGradient new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI43_0_0RNSVGUnits)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
