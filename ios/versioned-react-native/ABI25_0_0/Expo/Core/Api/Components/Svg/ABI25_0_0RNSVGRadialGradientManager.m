/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI25_0_0RNSVGRadialGradientManager.h"
#import "ABI25_0_0RNSVGRadialGradient.h"

@implementation ABI25_0_0RNSVGRadialGradientManager

ABI25_0_0RCT_EXPORT_MODULE()

- (ABI25_0_0RNSVGNode *)node
{
  return [ABI25_0_0RNSVGRadialGradient new];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI25_0_0RNSVGUnits)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
