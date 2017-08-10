/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI20_0_0RNSVGRadialGradientManager.h"
#import "ABI20_0_0RNSVGRadialGradient.h"

@implementation ABI20_0_0RNSVGRadialGradientManager

ABI20_0_0RCT_EXPORT_MODULE()

- (ABI20_0_0RNSVGNode *)node
{
  return [ABI20_0_0RNSVGRadialGradient new];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI20_0_0RNSVGUnits)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
