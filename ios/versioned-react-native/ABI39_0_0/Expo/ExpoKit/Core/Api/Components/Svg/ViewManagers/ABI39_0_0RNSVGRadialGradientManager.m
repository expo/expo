/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGRadialGradientManager.h"
#import "ABI39_0_0RNSVGRadialGradient.h"

@implementation ABI39_0_0RNSVGRadialGradientManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGNode *)node
{
  return [ABI39_0_0RNSVGRadialGradient new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI39_0_0RNSVGUnits)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
