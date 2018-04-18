/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RNSVGRadialGradientManager.h"
#import "ABI27_0_0RNSVGRadialGradient.h"

@implementation ABI27_0_0RNSVGRadialGradientManager

ABI27_0_0RCT_EXPORT_MODULE()

- (ABI27_0_0RNSVGNode *)node
{
  return [ABI27_0_0RNSVGRadialGradient new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI27_0_0RNSVGUnits)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
