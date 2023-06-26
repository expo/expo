/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGRadialGradientManager.h"
#import "ABI49_0_0RNSVGRadialGradient.h"

@implementation ABI49_0_0RNSVGRadialGradientManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGNode *)node
{
  return [ABI49_0_0RNSVGRadialGradient new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(fx, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(fy, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI49_0_0RNSVGUnits)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
