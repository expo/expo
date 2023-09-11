/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGRadialGradientManager.h"
#import "ABI48_0_0RNSVGRadialGradient.h"

@implementation ABI48_0_0RNSVGRadialGradientManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGNode *)node
{
  return [ABI48_0_0RNSVGRadialGradient new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI48_0_0RNSVGUnits)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
