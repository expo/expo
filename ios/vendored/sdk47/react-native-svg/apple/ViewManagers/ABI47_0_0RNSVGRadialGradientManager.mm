/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGRadialGradientManager.h"
#import "ABI47_0_0RNSVGRadialGradient.h"

@implementation ABI47_0_0RNSVGRadialGradientManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGNode *)node
{
  return [ABI47_0_0RNSVGRadialGradient new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI47_0_0RNSVGUnits)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
