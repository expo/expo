/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RNSVGRadialGradientManager.h"
#import "ABI30_0_0RNSVGRadialGradient.h"

@implementation ABI30_0_0RNSVGRadialGradientManager

ABI30_0_0RCT_EXPORT_MODULE()

- (ABI30_0_0RNSVGNode *)node
{
  return [ABI30_0_0RNSVGRadialGradient new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI30_0_0RNSVGUnits)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
